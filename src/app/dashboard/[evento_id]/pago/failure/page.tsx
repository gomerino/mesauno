import Link from "next/link";

export default async function DashboardPagoFailurePage({
  params,
}: {
  params: Promise<{ evento_id: string }>;
}) {
  const { evento_id } = await params;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-white">Pago no completado</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        El checkout de Mercado Pago no finalizó o fue rechazado. Puedes intentar de nuevo cuando quieras.
      </p>
      <Link
        href={`/dashboard/${evento_id}/equipo`}
        className="mt-8 inline-flex rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
      >
        Volver al panel
      </Link>
    </div>
  );
}
