"use client";

import { JourneyHeader } from "@/components/panel/journey/JourneyHeader";
import { PanelMobileBottomNav, PanelMobileHeader } from "@/components/panel/PanelMobileChrome";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_MAIN = [
  { href: "/panel", label: "Viaje", end: true },
  { href: "/panel/equipo", label: "Ajustes" },
] as const;

function navActive(pathname: string, href: string, end?: boolean) {
  if (end) {
    return pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
        active
          ? "border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-medium text-[#D4AF37]"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
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
};

export function PanelShell({ userEmail, children, unlockBanner }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-[#050810] md:flex-row">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.08),transparent)]"
        aria-hidden
      />

      <aside className="relative z-[1] hidden w-56 shrink-0 border-r border-white/[0.06] bg-[#070b14]/90 backdrop-blur-xl md:block lg:w-60">
        <div className="flex h-full flex-col gap-1 p-4 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto lg:py-6">
          <Link href="/panel" className="mb-2 font-display text-lg font-bold tracking-tight text-white">
            Dreams
          </Link>
          <p className="mb-4 truncate border-b border-white/[0.06] pb-3 text-[11px] text-slate-500">{userEmail}</p>

          <nav className="flex flex-col gap-0.5" aria-label="Navegación principal">
            {NAV_MAIN.map(({ href, label, ...rest }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                active={navActive(pathname, href, "end" in rest ? rest.end : false)}
              />
            ))}
          </nav>

          <Link href="/" className="mt-8 text-[11px] text-slate-600 transition hover:text-[#D4AF37]/90">
            ← Sitio público
          </Link>
        </div>
      </aside>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <PanelMobileHeader userEmail={userEmail} />
        <div className="min-w-0 flex-1 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-3 md:px-8 md:pb-10 md:pt-8">
          {unlockBanner ? (
            <div id="unlock-banner" className="mb-2 scroll-mt-6 animate-fadeIn md:mb-4">
              {unlockBanner}
            </div>
          ) : null}
          {!pathname.startsWith("/panel/experiencia") ? <JourneyHeader /> : null}
          <div className="transition-all duration-300 ease-out">{children}</div>
        </div>
      </div>

      <PanelMobileBottomNav />
    </div>
  );
}
