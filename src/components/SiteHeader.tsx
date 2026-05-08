import { JURNEX_BRAND } from "@/components/brand/jurnex-assets";
import { Plane } from "lucide-react";
import Link from "next/link";

type Props = {
  compact?: boolean;
  /** Login y vistas donde el logo debe leerse fuerte (mobile-first: más alto en todos los anchos). */
  prominentLogo?: boolean;
};

export function SiteHeader({ compact = false, prominentLogo = false }: Props) {
  const pad = compact ? "py-2 sm:py-2.5" : prominentLogo ? "py-3 sm:py-4" : "py-4";
  const logoH = compact
    ? "h-6 sm:h-7"
    : prominentLogo
      ? "h-11 w-auto sm:h-[3.25rem] md:h-14"
      : "h-7 sm:h-8";
  const logoMaxW = prominentLogo
    ? "max-w-[min(88vw,20rem)] sm:max-w-[22rem] md:max-w-[24rem]"
    : "max-w-[min(100%,10.5rem)] sm:max-w-[12rem]";

  return (
    <header className="shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div
        className={`mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-5 ${pad}`}
      >
        <Link
          href="/"
          className={`inline-flex shrink-0 items-center touch-manipulation ${logoH} ${logoMaxW} w-auto ${prominentLogo && !compact ? "min-h-[44px] sm:min-h-0" : ""}`}
          aria-label="Jurnex — inicio"
        >
          <img
            src={JURNEX_BRAND.logos.fullPng}
            alt="Jurnex — Plataforma de matrimonios digitales"
            width={1024}
            height={1024}
            className="h-full w-auto max-w-full object-contain object-left"
            decoding="async"
          />
        </Link>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-1.5 text-[13px] font-medium leading-tight text-teal-50 sm:flex-none sm:gap-x-5 sm:text-sm">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1 py-1.5 hover:text-white sm:px-0"
          >
            Crear mi viaje
            <Plane className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-white/12 px-3 py-2 text-white shadow-sm hover:bg-white/22 sm:px-4 sm:py-2.5"
          >
            Panel novios
          </Link>
        </nav>
      </div>
    </header>
  );
}
