"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, ListOrdered, Menu, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

const MORE_LINKS = [
  { href: "/panel/equipo", label: "Equipo" },
  { href: "/panel/invitados/vista", label: "Vista previa" },
  { href: "/panel/invitados/confirmaciones", label: "Confirmaciones" },
  { href: "/panel/finanzas", label: "Finanzas" },
  { href: "/marketplace", label: "Marketplace" },
] as const;

function pathMatches(pathname: string, href: string, end?: boolean): boolean {
  if (end) {
    return pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type TabItem = {
  href: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
};

const PRIMARY_TABS: TabItem[] = [
  { href: "/panel/overview", label: "Inicio", icon: Home, end: true },
  { href: "/panel/evento", label: "Evento", icon: CalendarDays },
  { href: "/panel/invitados", label: "Invitados", icon: Users },
  { href: "/panel/programa", label: "Programa", icon: ListOrdered },
];

export function PanelMobileHeader({ userEmail }: { userEmail: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/panel/overview" className="font-display text-base font-bold tracking-tight text-white">
          Dreams
        </Link>
        <p className="min-w-0 truncate text-[11px] text-slate-500" title={userEmail}>
          {userEmail}
        </p>
      </div>
    </header>
  );
}

export function PanelMobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive = MORE_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );

  return (
    <>
      {moreOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/55 md:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="panel-more-sheet"
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[min(72vh,520px)] rounded-t-2xl border border-white/10 bg-slate-950 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.45)] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-more-title"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p id="panel-more-title" className="text-sm font-semibold text-white">
                Más opciones
              </p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="max-h-[50vh] overflow-y-auto px-2 py-2" aria-label="Más secciones">
              <ul className="space-y-0.5">
                {MORE_LINKS.map(({ href, label }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMoreOpen(false)}
                        className={`block rounded-xl px-3 py-3 text-sm font-medium ${
                          active ? "bg-[#001d66] text-white" : "text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-white/10 px-4 py-3">
              <Link
                href="/"
                onClick={() => setMoreOpen(false)}
                className="text-xs text-slate-500 hover:text-teal-200"
              >
                ← Volver al sitio
              </Link>
            </div>
          </div>
        </>
      ) : null}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md md:hidden"
        aria-label="Panel principal"
      >
        <div className="mx-auto flex h-[3.25rem] max-w-lg items-end justify-between px-1">
          {PRIMARY_TABS.map(({ href, label, icon: Icon, end }) => {
            const active = pathMatches(pathname, href, end);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-lg py-1 ${
                  active ? "text-teal-300" : "text-slate-500"
                }`}
              >
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={active ? 2.25 : 2} aria-hidden />
                <span className="max-w-full truncate px-0.5 text-[10px] font-semibold leading-tight">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-lg py-1 ${
              moreActive ? "text-teal-300" : "text-slate-500"
            }`}
            aria-expanded={moreOpen}
            aria-controls="panel-more-sheet"
          >
            <Menu className="h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={moreActive ? 2.25 : 2} aria-hidden />
            <span className="text-[10px] font-semibold leading-tight">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
