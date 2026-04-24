import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";
import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-gradient-to-b from-jurnex-bg to-[#010812] px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl rounded-2xl border border-jurnex-border bg-jurnex-surface/40 p-10 text-center shadow-jurnex-card backdrop-blur-sm sm:p-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-jurnex-primary/90">Crea tu viaje</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-jurnex-text-primary sm:text-3xl">Boda, tablero e invitación, en la misma altitud</h2>
        <p className="mt-5 text-sm leading-relaxed text-jurnex-text-secondary sm:text-base">
          Nada de módulos aislados: hoy conectas panel, invitación, marketplace y pagos en la misma trayectoria, con cuidado en cada fase.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          <CrearMiEventoLink className="w-full max-w-sm sm:w-auto sm:px-12" />
          <Link
            href="/login"
            className="inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-full border border-jurnex-border bg-jurnex-surface/30 px-8 py-3 text-sm font-semibold text-jurnex-text-primary transition hover:border-jurnex-border hover:bg-jurnex-surface/50 sm:w-auto sm:px-10"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  );
}
