"use client";

import Image from "next/image";

type Props = {
  motivoText: string;
};

/**
 * Vista “postal” del motivo: papel envejecido, mensaje manuscrito (serif itálica), franja tipo estampilla.
 */
export function SoftAviationPostalMotivo({ motivoText }: Props) {
  const body =
    motivoText.trim().length > 0
      ? motivoText
      : "Con todo el cariño del mundo, esperamos compartir este día inolvidable con vos.";

  return (
    <div className="animate-fadeIn px-1 py-4">
      <div className="mx-auto max-w-md rounded-lg border border-[#1A2B48]/10 bg-[#FFF9F0] shadow-md">
        <div className="flex min-h-[14rem] flex-col sm:flex-row">
          {/* Mensaje (lado “escrito”) */}
          <div className="min-w-0 flex-1 border-b border-dashed border-[#1A2B48]/15 p-5 sm:border-b-0 sm:border-r sm:pb-8 sm:pr-6 sm:pt-6">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[#1A2B48]/40">Postal</p>
            <p className="mt-4 whitespace-pre-line font-serif text-base italic leading-[1.75] text-[#1A2B48]/90 sm:text-lg sm:leading-[1.8]">
              {body}
            </p>
          </div>

          {/* Franja estampilla: logo en disco (contraste para PNG multicolor) */}
          <div className="relative flex shrink-0 flex-row items-stretch justify-center border-t border-dashed border-[#1A2B48]/20 bg-[#FFF9F0]/95 px-4 py-5 sm:w-[9rem] sm:flex-col sm:border-l sm:border-t-0 sm:px-3 sm:py-6">
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 sm:flex-1 sm:gap-3">
              {/* Fondo dorado: el PNG usa líneas blancas; el logo se escala grande dentro del círculo. */}
              <div className="relative h-[6.75rem] w-[6.75rem] shrink-0 overflow-hidden rounded-full bg-gradient-to-b from-[#f3e2a8] via-[#e8ca62] to-[#b8941f] shadow-[0_3px_12px_rgba(26,43,72,0.16)] ring-1 ring-[#1A2B48]/22 sm:h-28 sm:w-28">
                <div className="absolute inset-0">
                  <Image
                    src="/dreams-airlines-logo.png"
                    alt="Dreams Airlines"
                    fill
                    className="object-contain object-center [transform:translateZ(0)_scale(1.62)] sm:[transform:translateZ(0)_scale(1.7)]"
                    sizes="(max-width: 640px) 128px, 140px"
                  />
                </div>
              </div>
              <p className="max-w-[6rem] text-center text-[8px] font-medium uppercase tracking-wider text-[#1A2B48]/45">
                Franqueo de corazón
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
