"use server";

import { buildEquipoInviteEmailHtml } from "@/lib/equipo-invite-email";
import { getCanonicalSiteOriginFromEnv } from "@/lib/public-origin";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

export type EquipoRol = "admin" | "editor" | "staff_centro";

function parseRpcJson(data: unknown): Record<string, unknown> | null {
  if (data == null) return null;
  if (typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

function revalidateEquipo() {
  revalidatePath("/panel/equipo");
  revalidatePath("/panel/overview");
}

export async function addMemberToEvent(
  eventoId: string,
  email: string,
  rol: EquipoRol
): Promise<{ ok: true; mode: "existing" | "invited" } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  const { data: isAdmin, error: eAdmin } = await supabase.rpc("user_is_evento_admin", {
    p_evento_id: eventoId,
  });
  if (eAdmin || !isAdmin) {
    return { ok: false, error: "Solo un administrador del evento puede invitar a colaboradores" };
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: "Indica un correo" };
  }

  const { data: rawAdd, error: errAdd } = await supabase.rpc("evento_add_member_existing_user", {
    p_evento_id: eventoId,
    p_email: normalized,
    p_rol: rol,
  });

  if (errAdd) {
    return { ok: false, error: errAdd.message };
  }

  const add = parseRpcJson(rawAdd);
  if (add?.ok === true) {
    revalidateEquipo();
    return { ok: true, mode: "existing" };
  }

  if (add?.error === "ya_miembro") {
    return { ok: false, error: "Este usuario ya es miembro del equipo" };
  }
  if (add?.error === "rol_invalido") {
    return { ok: false, error: "Rol no válido" };
  }

  if (add?.status !== "user_not_found") {
    return { ok: false, error: String(add?.error ?? "No se pudo añadir al miembro") };
  }

  const admin = await createStrictServiceClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "No hay cuenta de servicio configurada (SUPABASE_SERVICE_ROLE_KEY). Necesaria para invitar por correo a usuarios nuevos.",
    };
  }

  const origin =
    getCanonicalSiteOriginFromEnv() ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectTo = `${origin.replace(/\/$/, "")}/auth/callback`;

  const { data: linkPayload, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email: normalized,
    options: {
      redirectTo,
      data: {
        invited_evento_id: eventoId,
        invited_rol: rol,
      },
    },
  });

  const actionLink = linkPayload?.properties?.action_link;
  if (linkErr || !actionLink) {
    return {
      ok: false,
      error: linkErr?.message ?? "No se pudo generar el enlace de invitación",
    };
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("nombre_novio_1, nombre_novio_2, nombre_evento")
    .eq("id", eventoId)
    .maybeSingle();

  const ev = evento as {
    nombre_novio_1: string | null;
    nombre_novio_2: string | null;
    nombre_evento: string | null;
  } | null;
  const eventoLabel =
    [ev?.nombre_novio_1, ev?.nombre_novio_2].filter(Boolean).join(" & ") ||
    ev?.nombre_evento?.trim() ||
    "Tu evento";

  const rolLabel =
    rol === "admin" ? "Administrador" : rol === "editor" ? "Editor" : "Personal del centro (recepción)";

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return {
      ok: false,
      error:
        "Falta RESEND_API_KEY o RESEND_FROM_EMAIL. Configura Resend para enviar la invitación por correo.",
    };
  }

  const html = buildEquipoInviteEmailHtml({ actionLink, eventoLabel, rolLabel });
  const resend = new Resend(apiKey);
  const { error: sendErr } = await resend.emails.send({
    from,
    to: normalized,
    subject: `Invitación al equipo — ${eventoLabel}`,
    html,
  });

  if (sendErr) {
    return { ok: false, error: sendErr.message ?? "Error al enviar el correo" };
  }

  revalidateEquipo();
  return { ok: true, mode: "invited" };
}

export async function removeMemberFromEvent(
  eventoId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "No autenticado" };
  }

  const { data: raw, error } = await supabase.rpc("evento_equipo_remove_member", {
    p_evento_id: eventoId,
    p_user_id: userId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const res = parseRpcJson(raw);
  if (res?.ok === true) {
    revalidateEquipo();
    return { ok: true };
  }
  if (res?.error === "unico_admin") {
    return { ok: false, error: "No puedes eliminar al único administrador del evento" };
  }
  if (res?.error === "no_miembro") {
    return { ok: false, error: "Ese usuario no está en el equipo" };
  }

  return { ok: false, error: String(res?.error ?? "No se pudo eliminar") };
}
