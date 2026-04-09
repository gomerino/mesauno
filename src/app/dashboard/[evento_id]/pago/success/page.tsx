import Link from "next/link";

export default async function DashboardPagoSuccessPage({
  params,
}: {
  params: Promise<{ evento_id: string }>;
}) {
  const { evento_id } = await params;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-white">Pago recibido</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Mercado Pago está confirmando tu pago. En breve tu evento aparecerá como suscripción activa. Si no se actualiza en
        unos minutos, recarga el panel.
      </p>
      <Link
        href={`/dashboard/${evento_id}/equipo`}
        className="mt-8 inline-flex rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white"
      >
        Volver al panel
      </Link>
    </div>
  );
}
