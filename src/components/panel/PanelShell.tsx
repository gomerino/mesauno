"use client";

import { JourneyHeader } from "@/components/panel/journey/JourneyHeader";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { PANEL_SIDEBAR_GROUPS } from "@/components/panel/panel-nav-config";
import { PanelJourneyThemeContext } from "@/components/panel/panel-journey-theme-context";
import { PanelMobileBottomNav, PanelMobileHeader } from "@/components/panel/PanelMobileChrome";
import { JurnexOrbitIcon } from "@/components/brand/JurnexOrbitIcon";
import {
  JOURNEY_THEME_CHANGE_EVENT,
  journeyAmbientGlowClass,
  journeyPublicLinkHoverClass,
  readJourneyThemeFromStorage,
  type JourneyThemeId,
} from "@/theme/panel-themes";
import type { JourneyPhaseId } from "@/lib/journey-phases";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function navActive(pathname: string, href: string, end?: boolean) {
  if (end) {
    return pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isJourneyHomePath(pathname: string): boolean {
  return pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview";
}

function isPanelPostPaymentPath(pathname: string): boolean {
  return pathname === "/panel/success" || pathname === "/panel/post-pago";
}

function isPanelViajePath(pathname: string): boolean {
  return pathname === "/panel/viaje" || pathname.startsWith("/panel/viaje/");
}

function isPanelPasajerosPath(pathname: string): boolean {
  return pathname === "/panel/pasajeros" || pathname.startsWith("/panel/pasajeros/");
}

function isPanelExperienciaPath(pathname: string): boolean {
  return pathname === "/panel/experiencia" || pathname.startsWith("/panel/experiencia/");
}

function isPanelAjustesPath(pathname: string): boolean {
  return pathname === "/panel/ajustes" || pathname.startsWith("/panel/ajustes/");
}

function isPanelFinanzasPath(pathname: string): boolean {
  return pathname === "/panel/finanzas" || pathname.startsWith("/panel/finanzas/");
}

function isPanelRecuerdosPath(pathname: string): boolean {
  return pathname === "/panel/recuerdos" || pathname.startsWith("/panel/recuerdos/");
}

function NavLink({
  href,
  label,
  active,
  icon: Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
}) {
  if (active) {
    return (
      <Link
        href={href}
        aria-current="page"
        className="relative flex items-center gap-3 rounded-md bg-white/5 px-3 py-2 text-sm text-white transition-all"
      >
        <span
          className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-teal-400"
          aria-hidden
        />
        <Icon className="h-4 w-4 shrink-0 text-teal-400 opacity-100" strokeWidth={2.5} aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}

type Props = {
  userEmail: string;
  children: React.ReactNode;
  /** Banner opcional (p. ej. activar viaje con Mercado Pago). */
  unlockBanner?: React.ReactNode;
  journeyPhase: JourneyPhaseId;
  journeyProgressPrimary?: string;
  journeyProgressHint?: string | null;
};

export function PanelShell({
  userEmail,
  children,
  unlockBanner,
  journeyPhase,
  journeyProgressPrimary,
  journeyProgressHint,
}: Props) {
  const pathname = usePathname();
  const journeyHome = isJourneyHomePath(pathname);
  const postPaymentPage = isPanelPostPaymentPath(pathname);
  const viajePage = isPanelViajePath(pathname);
  const pasajerosPage = isPanelPasajerosPath(pathname);
  const experienciaPage = isPanelExperienciaPath(pathname);
  const ajustesPage = isPanelAjustesPath(pathname);
  const finanzasPage = isPanelFinanzasPath(pathname);
  const recuerdosPage = isPanelRecuerdosPath(pathname);
  const showJourneyChrome =
    !journeyHome &&
    !postPaymentPage &&
    !viajePage &&
    !pasajerosPage &&
    !experienciaPage &&
    !ajustesPage &&
    !finanzasPage &&
    !recuerdosPage;
  const [theme, setTheme] = useState<JourneyThemeId>("relax");

  useEffect(() => {
    setTheme(readJourneyThemeFromStorage());
    const sync = () => setTheme(readJourneyThemeFromStorage());
    window.addEventListener(JOURNEY_THEME_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(JOURNEY_THEME_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const glow = journeyAmbientGlowClass(theme);
  const publicHover = journeyPublicLinkHoverClass(theme);

  return (
    <PanelJourneyThemeContext.Provider value={theme}>
      <div
        data-theme={theme}
        className="jurnex-brand-layers flex min-h-screen flex-col bg-jurnex-bg md:flex-row"
      >
        <div className={`pointer-events-none fixed inset-0 transition-colors duration-300 ${glow}`} aria-hidden />

        <aside className="relative z-[1] hidden w-64 shrink-0 flex-col bg-black/40 border-r border-white/10 px-3 py-4 md:flex md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
            <Link
              href="/panel"
              className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-jurnex-text-primary transition hover:bg-white/[0.04]"
              aria-label="Jurnex, inicio del panel"
            >
              <JurnexOrbitIcon className="h-6 w-6 shrink-0" alt="" />
              <span className="font-display text-sm font-semibold tracking-tight text-white">Jurnex</span>
            </Link>
            <p className="mb-4 truncate border-b border-white/10 pb-3 text-[11px] text-white/50">
              {userEmail}
            </p>

            <nav className="flex flex-col gap-0.5" aria-label="Navegación principal">
              {PANEL_SIDEBAR_GROUPS[0].map(({ href, label, icon, end }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={navActive(pathname, href, end)}
                />
              ))}
              <div className="mt-6 border-t border-white/10 pt-4" aria-hidden />
              {PANEL_SIDEBAR_GROUPS[1].map(({ href, label, icon, end }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={navActive(pathname, href, end)}
                />
              ))}
              <div className="mt-6 border-t border-white/10 pt-4" aria-hidden />
              {PANEL_SIDEBAR_GROUPS[2].map(({ href, label, icon, end }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={navActive(pathname, href, end)}
                />
              ))}
            </nav>

            <Link
              href="/"
              className={`mt-8 text-[11px] text-white/45 transition hover:text-white/70 ${publicHover}`}
            >
              ← Sitio público
            </Link>
          </div>
        </aside>

        <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
          <PanelMobileHeader userEmail={userEmail} />
          <div className="min-w-0 flex-1 px-4 pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-3 md:px-8 md:pb-10 md:pt-8">
            {unlockBanner && !journeyHome ? (
              <div id="unlock-banner" className="mb-2 scroll-mt-6 animate-fadeIn md:mb-4">
                {unlockBanner}
              </div>
            ) : null}
            {showJourneyChrome ? <JourneyHeader /> : null}
            {showJourneyChrome ? (
              <div className="mt-4 md:mt-6">
                <JourneyPhasesBar
                  phase={journeyPhase}
                  progressPrimary={journeyProgressPrimary}
                  progressHint={journeyProgressHint}
                />
              </div>
            ) : null}
            <div
              className={`transition-all duration-300 ease-out ${
                showJourneyChrome ? "mt-6" : ""
              }`}
            >
              {children}
            </div>
          </div>
        </div>

        <PanelMobileBottomNav />
      </div>
    </PanelJourneyThemeContext.Provider>
  );
}
