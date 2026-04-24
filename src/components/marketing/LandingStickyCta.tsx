import Link from "next/link";
import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";

/** CTA fija en móvil: crear viaje + market; sin precios. */
export function LandingStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-jurnex-border bg-jurnex-bg/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md md:hidden">
      <div className="flex flex-col gap-2">
        <CrearMiEventoLink className="w-full text-sm" />
        <Link
          href="/marketplace"
          className="min-h-[44px] w-full text-center text-xs font-medium text-jurnex-primary/90 underline-offset-2 hover:text-jurnex-primary hover:underline"
        >
          Explorar marketplace
        </Link>
      </div>
    </div>
  );
}
