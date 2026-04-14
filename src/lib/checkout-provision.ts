import { createStrictServiceClient } from "@/lib/supabase/server";
import { getMagicLinkRedirectOrigin } from "@/lib/public-origin";
import type { PricingPlanId } from "@/lib/pricing-plans";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MpPaymentLike = {
  id?: string | number;
  status?: string;
  external_reference?: string | null;
  transaction_amount?: number | null;
};

type CheckoutSessionRow = {
  id: string;
  plan: PricingPlanId;
  nombre: string;
  email: string;
  status: string;
  evento_id: string | null;
};

async function getOrCreateAuthUserId(
  admin: SupabaseClient,
  email: string,
  nombre: string
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: { full_name: nombre.trim() },
  });

  if (!createErr && created.user?.id) {
    return created.user.id;
  }

  const msg = createErr?.message?.toLowerCase() ?? "";
  if (
    createErr &&
    (msg.includes("already") || msg.includes("registered") || createErr.status === 422)
  ) {
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw listErr;
    const found = listData?.users?.find((u) => u.email?.toLowerCase() === normalized);
    if (found?.id) return found.id;
  }

  throw createErr ?? new Error("auth_create_user_failed");
}

export type ProvisionResult =
  | { ok: true; email: string; alreadyDone: boolean }
  | { ok: false; reason: string };

/**
 * Tras pago aprobado: crea usuario (si no existe), evento y membresía admin.
 * Idempotente si la sesión ya está provisionada o el evento ya existe para esa sesión.
 */
export async function provisionCheckoutSessionFromPayment(
  payment: MpPaymentLike
): Promise<ProvisionResult> {
  if (payment.status !== "approved") {
    return { ok: false, reason: "payment_not_approved" };
  }

  const paymentId = payment.id != null ? String(payment.id) : "";
  if (!paymentId) return { ok: false, reason: "missing_payment_id" };

  const sessionId = payment.external_reference?.trim();
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!sessionId || !uuidRe.test(sessionId)) {
    return { ok: false, reason: "invalid_external_reference" };
  }

  const supabase = await createStrictServiceClient();
  if (!supabase) {
    return { ok: false, reason: "service_role_missing" };
  }

  const { data: session, error: sesErr } = await supabase
    .from("checkout_sessions")
    .select("id, plan, nombre, email, status, evento_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sesErr || !session) {
    return { ok: false, reason: "checkout_session_not_found" };
  }

  const row = session as CheckoutSessionRow;
  const email = row.email.trim().toLowerCase();

  if (row.status === "provisioned" && row.evento_id) {
    return { ok: true, email, alreadyDone: true };
  }

  let userId: string;
  try {
    userId = await getOrCreateAuthUserId(supabase, row.email, row.nombre);
  } catch (e) {
    console.error("[provision] auth user", e);
    return { ok: false, reason: "auth_failed" };
  }

  const { data: eventoIns, error: evErr } = await supabase
    .from("eventos")
    .insert({
      nombre_evento: "Mi evento",
      plan: row.plan,
      plan_status: "paid",
      payment_id: paymentId,
      monto_pagado: payment.transaction_amount ?? null,
      checkout_session_id: sessionId,
    })
    .select("id")
    .single();

  if (evErr) {
    if (evErr.code === "23505") {
      const { data: existing } = await supabase
        .from("eventos")
        .select("id")
        .eq("checkout_session_id", sessionId)
        .maybeSingle();
      if (existing?.id) {
        await supabase.from("evento_miembros").upsert(
          { evento_id: existing.id, user_id: userId, rol: "admin" },
          { onConflict: "evento_id,user_id" }
        );
        await supabase
          .from("checkout_sessions")
          .update({
            status: "provisioned",
            mp_payment_id: paymentId,
            evento_id: existing.id,
            user_id: userId,
          })
          .eq("id", sessionId);
        return { ok: true, email, alreadyDone: true };
      }
    }
    console.error("[provision] evento insert", evErr);
    return { ok: false, reason: "evento_insert_failed" };
  }

  const eventoId = eventoIns?.id as string;

  const { error: memErr } = await supabase.from("evento_miembros").insert({
    evento_id: eventoId,
    user_id: userId,
    rol: "admin",
  });

  if (memErr) {
    console.error("[provision] evento_miembros", memErr);
    return { ok: false, reason: "membership_insert_failed" };
  }

  const { error: upErr } = await supabase
    .from("checkout_sessions")
    .update({
      status: "provisioned",
      mp_payment_id: paymentId,
      evento_id: eventoId,
      user_id: userId,
    })
    .eq("id", sessionId);

  if (upErr) {
    console.error("[provision] checkout_sessions update", upErr);
    return { ok: false, reason: "session_update_failed" };
  }

  return { ok: true, email, alreadyDone: false };
}

/** Tras pago: ir al panel del evento (no a la demo de onboarding). `welcome=1` muestra banner de bienvenida. */
const MAGIC_LINK_NEXT = "/panel/evento?welcome=1";

/**
 * URL para iniciar sesión tras el pago.
 * `action_link` de `generateLink` no es compatible con el cliente PKCE por defecto (@supabase/ssr);
 * usamos `token_hash` + `verifyOtp` en `/auth/callback` (mismo patrón que recomienda Supabase para este caso).
 */
export async function buildPostPaymentMagicLink(email: string): Promise<string | null> {
  const supabase = await createStrictServiceClient();
  if (!supabase) return null;

  const origin = await getMagicLinkRedirectOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(MAGIC_LINK_NEXT)}`;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: email.trim().toLowerCase(),
    options: {
      redirectTo,
    },
  });

  const hashed = data?.properties?.hashed_token;
  if (error || !hashed || typeof hashed !== "string") {
    console.error("[provision] generateLink", error, { hasHashed: Boolean(hashed) });
    return null;
  }

  const url = new URL(`${origin}/auth/callback`);
  url.searchParams.set("token_hash", hashed);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", MAGIC_LINK_NEXT);
  return url.toString();
}
