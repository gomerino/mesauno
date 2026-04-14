"use client";

import { PanelMobileBottomNav, PanelMobileHeader } from "@/components/panel/PanelMobileChrome";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_TU_EVENTO = [
  { href: "/panel/overview", label: "Inicio", end: true },
  { href: "/panel/evento", label: "Evento" },
  { href: "/panel/invitados", label: "Invitados" },
  { href: "/panel/programa", label: "Programa" },
  { href: "/panel/equipo", label: "Equipo" },
] as const;

const NAV_GESTION = [
  { href: "/panel/invitados/vista", label: "Vista previa" },
  { href: "/panel/invitados/confirmaciones", label: "Confirmaciones" },
  { href: "/panel/finanzas", label: "Finanzas" },
] as const;

const NAV_EXPLORAR = [{ href: "/marketplace", label: "Marketplace" }] as const;

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
      className={`rounded-lg px-3 py-2 text-sm font-medium transition md:py-2.5 ${
        active ? "bg-[#001d66] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: readonly { href: string; label: string; end?: boolean }[];
  pathname: string;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{title}</p>
      <nav className="flex flex-row flex-wrap gap-1 md:flex-col md:flex-nowrap md:gap-0.5" aria-label={title}>
        {items.map(({ href, label, ...rest }) => (
          <NavLink key={href} href={href} label={label} active={navActive(pathname, href, "end" in rest ? rest.end : false)} />
        ))}
      </nav>
    </div>
  );
}

type Props = {
  userEmail: string;
  children: React.ReactNode;
};

export function PanelShell({ userEmail, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden shrink-0 border-b border-white/10 bg-slate-950/95 backdrop-blur md:block md:w-64 md:border-b-0 md:border-r">
        <div className="flex flex-col gap-0 p-4 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
          <Link href="/" className="mb-3 font-display text-lg font-bold tracking-tight text-white">
            Dreams Wedding
          </Link>
          <p className="mb-4 truncate border-b border-white/10 pb-3 text-xs text-slate-500">{userEmail}</p>

          <NavGroup title="Tu evento" items={NAV_TU_EVENTO} pathname={pathname} />
          <NavGroup title="Gestión" items={NAV_GESTION} pathname={pathname} />
          <NavGroup title="Explorar" items={NAV_EXPLORAR} pathname={pathname} />

          <Link href="/" className="mt-6 text-xs text-slate-500 hover:text-teal-200">
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <PanelMobileHeader userEmail={userEmail} />
        <div className="min-w-0 flex-1 px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pt-4 md:px-8 md:pb-8 md:pt-8">
          {children}
        </div>
      </div>

      <PanelMobileBottomNav />
    </div>
  );
}
