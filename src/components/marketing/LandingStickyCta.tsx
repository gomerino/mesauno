import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";

/** CTA fija en móvil: una sola acción primaria para conversión limpia. */
export function LandingStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-sticky-cta border-t border-jurnex-border bg-jurnex-bg/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md md:hidden">
      <div className="flex flex-col gap-2">
        <CrearMiEventoLink className="w-full text-sm" withEmoji>
          Crear mi invitación
        </CrearMiEventoLink>
      </div>
    </div>
  );
}
