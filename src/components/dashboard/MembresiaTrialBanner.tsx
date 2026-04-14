import { BotonPago } from "@/components/dashboard/BotonPago";

type Props = {
  eventoId: string;
  /** Versión reducida para pie de página en móvil. */
  compact?: boolean;
};

/**
 * Aviso para novios con plan trial: invita a completar el pago de la membresía Mesa Uno.
 */
export function MembresiaTrialBanner({ eventoId, compact }: Props) {
  if (compact) {
    return (
      <div className="w-full rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 to-amber-900/15 px-3 py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">Trial</p>
            <p className="mt-0.5 text-[11px] leading-snug text-amber-50/95">
              Activa tu plan para Mesa Uno sin límites.
            </p>
          </div>
          <BotonPago
            eventoId={eventoId}
            className="w-full shrink-0 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 shadow-md disabled:opacity-60 sm:w-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 w-full rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-900/20 px-4 py-4 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">Cuenta en trial</p>
          <p className="mt-1 text-sm text-amber-50/95">
            Activa la suscripción para desbloquear Mesa Uno sin límites. El pago es seguro con Mercado Pago.
          </p>
        </div>
        <div className="shrink-0 sm:self-center">
          <BotonPago eventoId={eventoId} />
        </div>
      </div>
    </div>
  );
}
