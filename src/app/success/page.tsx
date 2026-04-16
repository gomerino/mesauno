import { buildPostPaymentMagicLink, provisionCheckoutSessionFromPayment } from "@/lib/checkout-provision";
import {
  canProcessPricingCheckoutBypassSuccess,
  createMercadoPagoConfig,
} from "@/lib/mercadopago-server";
import { isPricingPlanId, PRICING_PLANS } from "@/lib/pricing-plans";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Payment } from "mercadopago";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pago recibido — Dreams",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickParam(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

/** Si ya hay sesión con el mismo email del checkout, ir al panel sin magic link. */
async function maybeRedirectToPanelSuccess(
  provision: { ok: true; email: string; alreadyDone: boolean },
  paymentIdForQuery: string | null
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email && user.email.toLowerCase() === provision.email.toLowerCase()) {
    const q = paymentIdForQuery ? `?payment_id=${encodeURIComponent(paymentIdForQuery)}` : "";
    redirect(`/panel/success${q}`);
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const bypassAllowed = canProcessPricingCheckoutBypassSuccess();
  const mpBypass = pickParam(searchParams, "mp_bypass");
  const checkoutSessionId = pickParam(searchParams, "checkout_session_id");

  if (mpBypass === "1" && checkoutSessionId) {
    if (!bypassAllowed) {
      return (
        <ResultShell>
          <p className="text-slate-300">
            El bypass de pago no está permitido en este entorno. En local usa <code className="text-slate-400">npm run dev</code>, define{" "}
            <code className="text-slate-400">MP_CHECKOUT_BYPASS=1</code>, o <code className="text-slate-400">MP_ALLOW_CLIENT_BYPASS=1</code> con{" "}
            <code className="text-slate-400">/pricing?bypass=1</code>.
          </p>
          <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
            Volver a planes
          </Link>
        </ResultShell>
      );
    }
    if (!UUID_RE.test(checkoutSessionId)) {
      return (
        <ResultShell>
          <p className="text-slate-300">Sesión de checkout inválida.</p>
          <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
            Volver a planes
          </Link>
        </ResultShell>
      );
    }

    const supabase = await createStrictServiceClient();
    if (!supabase) {
      return (
        <ResultShell>
          <p className="text-slate-300">Servidor sin SUPABASE_SERVICE_ROLE_KEY.</p>
          <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
            Volver a planes
          </Link>
        </ResultShell>
      );
    }

    const { data: sess } = await supabase
      .from("checkout_sessions")
      .select("plan")
      .eq("id", checkoutSessionId)
      .maybeSingle();

    const plan = sess?.plan;
    const amount =
      typeof plan === "string" && isPricingPlanId(plan) ? PRICING_PLANS[plan].priceClp : null;

    const provision = await provisionCheckoutSessionFromPayment({
      id: `bypass_${checkoutSessionId}`,
      status: "approved",
      external_reference: checkoutSessionId,
      transaction_amount: amount,
    });

    if (!provision.ok) {
      return (
        <ResultShell>
          <p className="text-slate-300">No pudimos activar tu cuenta ({provision.reason}).</p>
          <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
            Volver a planes
          </Link>
        </ResultShell>
      );
    }

    await maybeRedirectToPanelSuccess(provision, `bypass_${checkoutSessionId}`);

    const magic = await buildPostPaymentMagicLink(provision.email);
    if (magic) {
      redirect(magic);
    }

    return (
      <ResultShell>
        <p className="text-slate-300">
          Bypass sin magic link. Entra con{" "}
          <strong className="text-white">{provision.email}</strong> en{" "}
          <Link href="/login" className="text-[#D4AF37] hover:underline">
            /login
          </Link>
          .
        </p>
      </ResultShell>
    );
  }

  const paymentId = pickParam(searchParams, "payment_id") ?? pickParam(searchParams, "collection_id");
  const mpConfig = createMercadoPagoConfig();

  if (!paymentId) {
    return (
      <ResultShell>
        <p className="text-slate-300">No encontramos el comprobante de pago en la URL.</p>
        <p className="mt-3 text-xs text-slate-500">
          Si estás probando sin Mercado Pago, usa el flujo con <code className="text-slate-400">MP_CHECKOUT_BYPASS=1</code> desde{" "}
          <Link href="/pricing" className="text-[#D4AF37] hover:underline">
            /pricing
          </Link>
          .
        </p>
        <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
          Volver a planes
        </Link>
      </ResultShell>
    );
  }

  if (!mpConfig) {
    return (
      <ResultShell>
        <p className="text-slate-300">Mercado Pago no está configurado en el servidor.</p>
        <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
          Volver a planes
        </Link>
      </ResultShell>
    );
  }

  const paymentApi = new Payment(mpConfig);
  let payment;
  try {
    payment = await paymentApi.get({ id: paymentId });
  } catch {
    return (
      <ResultShell>
        <p className="text-slate-300">No pudimos validar el pago con Mercado Pago.</p>
        <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
          Volver a planes
        </Link>
      </ResultShell>
    );
  }

  if (payment.status !== "approved") {
    return (
      <ResultShell>
        <p className="text-slate-300">
          El pago no está aprobado todavía (estado: {String(payment.status)}).
        </p>
        <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
          Volver a planes
        </Link>
      </ResultShell>
    );
  }

  const provision = await provisionCheckoutSessionFromPayment({
    id: payment.id,
    status: payment.status,
    external_reference: payment.external_reference,
    transaction_amount: payment.transaction_amount,
  });

  if (!provision.ok) {
    return (
      <ResultShell>
        <p className="text-slate-300">No pudimos activar tu cuenta ({provision.reason}).</p>
        <p className="mt-4 text-xs text-slate-500">Si ya pagaste, escríbenos con el ID de pago: {paymentId}</p>
        <Link href="/pricing" className="mt-6 inline-block text-[#D4AF37] hover:underline">
          Volver a planes
        </Link>
      </ResultShell>
    );
  }

  await maybeRedirectToPanelSuccess(provision, String(payment.id));

  const magic = await buildPostPaymentMagicLink(provision.email);
  if (magic) {
    redirect(magic);
  }

  return (
    <ResultShell>
      <p className="text-slate-300">
        Tu evento está listo. Abre el enlace que te enviamos a <strong className="text-white">{provision.email}</strong>{" "}
        para entrar (magic link).
      </p>
      <Link href="/login" className="mt-6 inline-block text-[#D4AF37] hover:underline">
        Ir a iniciar sesión
      </Link>
    </ResultShell>
  );
}

function ResultShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617]">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-20 text-center sm:py-28">{children}</main>
    </div>
  );
}
