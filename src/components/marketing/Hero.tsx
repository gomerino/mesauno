import { JurnexMark } from "@/components/brand/JurnexMark";
import { CrearMiEventoLink } from "@/components/marketing/CrearMiEventoLink";
import { Plane, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * Eco visual del pase (onboarding / invitación) sin embeber iframe.
 */
function HeroTicketFrame() {
  return (
    <div className="relative w-full max-w-sm animate-ticketPrintIn">
      <div
        className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-teal-400/25 via-transparent to-jurnex-secondary/15 opacity-80 blur-sm"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-jurnex-surface/90 shadow-jurnex-card ring-1 ring-jurnex-border backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-jurnex-border bg-black/20 px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-jurnex-text-secondary">Jurnex · pase de abordaje</p>
          <span className="text-teal-300" aria-hidden>
            <Plane className="h-4 w-4" strokeWidth={2} />
          </span>
        </div>
        <div className="bg-invite-sand/95 p-4 text-invite-navy sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-invite-navy/70">Pasajeros</p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight">Tu nombre y el de tu pareja</p>
          <p className="mt-0.5 text-sm text-invite-navy/80">Boda en el destino que elijan juntos</p>
          <div className="mt-4 flex border-t border-dashed border-invite-navy/20 pt-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase text-invite-navy/55">Vuelo</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">JX · 1 AMOR</p>
            </div>
            <div className="min-w-0 flex-1 pl-2 text-right">
              <p className="text-[10px] font-bold uppercase text-invite-navy/55">Asiento</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">12A</p>
            </div>
            <div className="min-w-0 flex-1 pl-2 text-right">
              <p className="text-[10px] font-bold uppercase text-invite-navy/55">Puerta</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">B</p>
            </div>
          </div>
        </div>
        <div className="border-t border-jurnex-border bg-jurnex-bg/50 px-4 py-3">
          <p className="text-center text-[10px] leading-relaxed text-jurnex-text-muted sm:text-[11px]">
            Cada invitado, su pase. El mismo cuidado que conduces desde el panel.
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-jurnex-text-muted sm:justify-end">
        <Sparkles className="h-3.5 w-3.5 text-teal-400/80" strokeWidth={2} aria-hidden />
        Misma lógica que al crear tu viaje en Jurnex
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-jurnex-border bg-gradient-to-b from-jurnex-bg via-[#040d18] to-jurnex-bg px-4 pb-16 pt-12 sm:pb-20 sm:pt-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(232,154,30,0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-jurnex-secondary/95">
            Crea tu viaje
          </p>
          <h1 className="font-display text-[clamp(1.9rem,5.2vw,3.1rem)] font-bold leading-[1.1] tracking-tight text-jurnex-text-primary">
            <span className="text-jurnex-secondary/95">Boda, invitación y tripulación</span> en un solo tablero
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-jurnex-text-secondary sm:text-lg lg:mx-0">
              Hoy en Jurnex: onboarding de arranque, <strong className="font-medium text-jurnex-text-primary">panel de novios</strong> (itinerario,
            invitados, recuerdos, regalos), <strong className="font-medium text-jurnex-text-primary">invitación digital</strong> con estética pase
            de abordaje, <strong className="font-medium text-jurnex-text-primary">marketplace</strong> de proveedores y pago con Mercado Pago.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <CrearMiEventoLink className="w-full sm:w-auto" />
            <Link
              href="#invitacion-jurnex"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-jurnex-border bg-white/[0.04] px-6 py-3 text-sm font-semibold text-jurnex-text-primary transition hover:bg-white/[0.08] active:scale-[0.99] sm:w-auto"
            >
              Cómo se ve la invitación
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-jurnex-border/80 bg-transparent px-6 py-3 text-sm font-medium text-jurnex-text-secondary transition hover:border-jurnex-border hover:text-jurnex-text-primary sm:w-auto"
            >
              Explorar proveedores
            </Link>
          </div>
        </div>
        <div className="relative flex w-full flex-col items-center justify-center gap-5 lg:max-w-[24rem] lg:shrink-0 lg:items-end">
          <HeroTicketFrame />
          <div className="w-full max-w-sm rounded-2xl border border-jurnex-border bg-jurnex-surface/60 p-4 shadow-jurnex-card sm:p-5">
            <JurnexMark variant="fullPng" className="mx-auto h-auto w-full max-w-[9rem] object-contain" alt="" />
            <p className="mt-2 text-center text-xs text-jurnex-text-muted">
              Marketplace y panel con el mismo criterio: orden al planificar, afecto al compartir con quien acompaña el vuelo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
