"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function buildNav(equipoHref: string | null, programaHref: string | null) {
  const head = [
    { href: "/panel", label: "Inicio", end: true },
    { href: "/panel/evento", label: "Evento" },
  ] as const;
  const mid: { href: string; label: string }[] = [];
  if (programaHref) mid.push({ href: programaHref, label: "Programa" });
  if (equipoHref) mid.push({ href: equipoHref, label: "Equipo" });
  const tail = [
    { href: "/panel/invitados", label: "Crear invitados" },
    { href: "/panel/vista-invitacion", label: "Ver invitación" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/panel/asistentes", label: "Asistentes (RSVP)" },
    { href: "/panel/regalos", label: "Regalos y dinero" },
  ] as const;
  return [...head, ...mid, ...tail] as const;
}

function navActive(pathname: string, href: string, end?: boolean) {
  if (end) {
    return pathname === "/panel" || pathname === "/panel/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  userEmail: string;
  /** Enlace a gestión de equipo del evento (solo admin/editor). */
  equipoHref?: string | null;
  /** Cronograma que ven los invitados (Mesa Uno /dashboard). */
  programaHref?: string | null;
  children: React.ReactNode;
};

export function PanelShell({ userEmail, equipoHref = null, programaHref = null, children }: Props) {
  const pathname = usePathname();
  const NAV = buildNav(equipoHref, programaHref);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="shrink-0 border-b border-white/10 bg-slate-950/95 backdrop-blur md:w-64 md:border-b-0 md:border-r">
        <div className="flex flex-col gap-1 p-4 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
          <Link href="/" className="mb-4 font-display text-lg font-bold tracking-tight text-white">
            Dreams Wedding
          </Link>
          <p className="mb-3 truncate border-b border-white/10 pb-3 text-xs text-slate-500">{userEmail}</p>
          <nav className="flex flex-row flex-wrap gap-1 md:flex-col md:flex-nowrap md:gap-0.5">
            {NAV.map(({ href, label, ...rest }) => {
              const active = navActive(pathname, href, "end" in rest ? rest.end : false);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition md:py-2.5 ${
                    active
                      ? "bg-[#001d66] text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/"
            className="mt-4 hidden text-xs text-slate-500 hover:text-teal-200 md:block"
          >
            ← Volver al sitio
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
