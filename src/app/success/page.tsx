import { buildPostPaymentMagicLink, provisionCheckoutSessionFromPayment } from "@/lib/checkout-provision";
import { createMercadoPagoConfig } from "@/lib/mercadopago-server";
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

function pickParam(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const paymentId = pickParam(searchParams, "payment_id") ?? pickParam(searchParams, "collection_id");
  const mpConfig = createMercadoPagoConfig();

  if (!paymentId) {
    return (
      <ResultShell>
        <p className="text-slate-300">No encontramos el comprobante de pago en la URL.</p>
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
