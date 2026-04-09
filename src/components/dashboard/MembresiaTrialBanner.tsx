import { BotonPago } from "@/components/dashboard/BotonPago";

type Props = {
  eventoId: string;
};

/**
 * Aviso para novios con plan trial: invita a completar el pago de la membresía Mesa Uno.
 */
export function MembresiaTrialBanner({ eventoId }: Props) {
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
