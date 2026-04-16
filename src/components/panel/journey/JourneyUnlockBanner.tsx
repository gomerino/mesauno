"use client";

import { JourneyUnlockCheckout } from "@/components/panel/journey/JourneyUnlockCheckout";

type Props = {
  eventoId: string;
  userEmail: string;
  prefillNombre: string;
};

export function JourneyUnlockBanner({ eventoId, userEmail, prefillNombre }: Props) {
  return (
    <div className="mb-5 rounded-xl border border-white/[0.08] bg-[#0a0e16]/90 p-3 shadow-none backdrop-blur-sm sm:mb-6 sm:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5 lg:justify-between">
        <div className="min-w-0 lg:max-w-[min(28rem,46%)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/85">Siguiente escala</p>
          <p className="mt-0.5 font-display text-base font-semibold leading-snug text-white sm:text-lg">
            Desbloqueá invitaciones, música y álbum
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">Un solo pago con Mercado Pago. Sin salir de tu viaje.</p>
        </div>
        <div className="min-w-0 w-full shrink-0 lg:max-w-[min(100%,26rem)]">
          <JourneyUnlockCheckout eventoId={eventoId} userEmail={userEmail} prefillNombre={prefillNombre} />
        </div>
      </div>
    </div>
  );
}
