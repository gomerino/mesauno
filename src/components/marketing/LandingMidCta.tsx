import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";
import Link from "next/link";

/** CTA intermedia: crear viaje + enlace a marketplace, sin precios. */
export function LandingMidCta() {
  return (
    <section className="border-b border-jurnex-border bg-jurnex-surface/30 px-4 py-12 sm:py-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-sm text-jurnex-text-secondary">¿Falta una pieza en el tablero? Puedes afinarla con proveedores en el marketplace.</p>
        <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <CrearMiEventoLink className="w-full sm:w-auto" />
          <Link
            href="/marketplace"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-jurnex-border bg-jurnex-surface/40 px-8 py-3 text-sm font-semibold text-jurnex-text-primary transition hover:border-jurnex-border hover:bg-jurnex-surface/60 sm:w-auto"
          >
            Ver proveedores
          </Link>
        </div>
      </div>
    </section>
  );
}
