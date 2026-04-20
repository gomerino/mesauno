"use client";

import { JourneyHeader } from "@/components/panel/journey/JourneyHeader";
import { JourneyPhasesBar } from "@/components/panel/journey/JourneyPhasesBar";
import { panelSidebarVisibleItems } from "@/components/panel/panel-nav-config";
import { PanelJourneyThemeContext } from "@/components/panel/panel-journey-theme-context";
import { PanelMobileBottomNav, PanelMobileHeader } from "@/components/panel/PanelMobileChrome";
import {
  JOURNEY_THEME_CHANGE_EVENT,
  journeyAmbientGlowClass,
  journeyNavActiveClasses,
  journeyPublicLinkHoverClass,
  readJourneyThemeFromStorage,
  type JourneyThemeId,
} from "@/theme/panel-themes";
import type { JourneyPhaseId } from "@/lib/journey-phases";
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

function isPanelEventoPath(pathname: string): boolean {
  return pathname === "/panel/evento" || pathname.startsWith("/panel/evento/");
}

function isPanelInvitadosPath(pathname: string): boolean {
  return pathname === "/panel/invitados" || pathname.startsWith("/panel/invitados/");
}

function isPanelProgramaPath(pathname: string): boolean {
  return pathname === "/panel/programa" || pathname.startsWith("/panel/programa/");
}

function isPanelExperienciaPath(pathname: string): boolean {
  return pathname === "/panel/experiencia" || pathname.startsWith("/panel/experiencia/");
}

function isPanelEquipoPath(pathname: string): boolean {
  return pathname === "/panel/equipo" || pathname.startsWith("/panel/equipo/");
}

function isPanelFinanzasPath(pathname: string): boolean {
  return pathname === "/panel/finanzas" || pathname.startsWith("/panel/finanzas/");
}

function isPanelInvitacionPath(pathname: string): boolean {
  return pathname === "/panel/invitacion" || pathname.startsWith("/panel/invitacion/");
}

function NavLink({
  href,
  label,
  active,
  theme,
}: {
  href: string;
  label: string;
  active: boolean;
  theme: JourneyThemeId;
}) {
  const activeCls = journeyNavActiveClasses(theme);
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
        active ? `border ${activeCls}` : "text-jurnex-text-secondary hover:bg-jurnex-surface-hover hover:text-jurnex-text-primary"
      }`}
    >
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
  const eventoPage = isPanelEventoPath(pathname);
  const invitadosPage = isPanelInvitadosPath(pathname);
  const programaPage = isPanelProgramaPath(pathname);
  const experienciaPage = isPanelExperienciaPath(pathname);
  const equipoPage = isPanelEquipoPath(pathname);
  const finanzasPage = isPanelFinanzasPath(pathname);
  const invitacionPage = isPanelInvitacionPath(pathname);
  const showJourneyChrome =
    !journeyHome &&
    !postPaymentPage &&
    !eventoPage &&
    !invitadosPage &&
    !programaPage &&
    !experienciaPage &&
    !equipoPage &&
    !finanzasPage &&
    !invitacionPage;
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
      <div data-theme={theme} className="flex min-h-screen flex-col bg-jurnex-bg md:flex-row">
        <div className={`pointer-events-none fixed inset-0 transition-colors duration-300 ${glow}`} aria-hidden />

        <aside className="relative z-[1] hidden w-56 shrink-0 border-r border-jurnex-border bg-jurnex-surface/90 backdrop-blur-xl md:block lg:w-60">
          <div className="flex h-full flex-col gap-1 p-4 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto lg:py-6">
            <Link
              href="/panel"
              className="mb-2 font-display text-lg font-bold tracking-tight text-jurnex-text-primary"
            >
              Dreams
            </Link>
            <p className="mb-4 truncate border-b border-jurnex-border pb-3 text-[11px] text-jurnex-text-muted">
              {userEmail}
            </p>

            <nav className="flex flex-col gap-0.5" aria-label="Navegación principal">
              {panelSidebarVisibleItems().map(({ href, label, ...rest }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  theme={theme}
                  active={navActive(pathname, href, "end" in rest ? rest.end : false)}
                />
              ))}
            </nav>

            <Link
              href="/"
              className={`mt-8 text-[11px] text-jurnex-text-muted transition ${publicHover}`}
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
            {!pathname.startsWith("/panel/experiencia") && showJourneyChrome ? <JourneyHeader /> : null}
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
