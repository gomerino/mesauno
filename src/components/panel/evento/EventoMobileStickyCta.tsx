"use client";

import { EventoConfigPrimaryCta } from "@/components/panel/evento/EventoConfigPrimaryCta";
import type { EventoConfigCTAResult } from "@/lib/evento-config-cta";

type Props = {
  result: EventoConfigCTAResult;
};

/** Barra inferior fija solo mientras falta un paso de configuración en esta pantalla. */
export function EventoMobileStickyCta({ result }: Props) {
  if (result.status === "complete") return null;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-black/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <EventoConfigPrimaryCta result={result} />
    </div>
  );
}
