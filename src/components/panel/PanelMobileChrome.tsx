"use client";

import { PANEL_MOBILE_TABS } from "@/components/panel/panel-nav-config";
import { journeyMobileNavActiveClass } from "@/theme/panel-themes";
import type { JourneyThemeId } from "@/theme/panel-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

function pathMatches(pathname: string, href: string, end?: boolean): boolean {
  if (end) {
    return pathname === "/panel" || pathname === "/panel/" || pathname === "/panel/overview";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PanelMobileHeader({ userEmail }: { userEmail: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b14]/85 px-4 py-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/panel" className="font-display text-base font-bold tracking-tight text-white">
          Dreams
        </Link>
        <p className="min-w-0 truncate text-[10px] text-slate-500" title={userEmail}>
          {userEmail}
        </p>
      </div>
    </header>
  );
}

export function PanelMobileBottomNav({ theme = "relax" }: { theme?: JourneyThemeId }) {
  const pathname = usePathname();
  const activeAccent = journeyMobileNavActiveClass(theme);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#070b14]/95 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl md:hidden"
      aria-label="Navegación del viaje"
    >
      <div className="mx-auto flex h-[3.5rem] max-w-lg items-end justify-between gap-0.5 px-1">
        {PANEL_MOBILE_TABS.map(({ href, label, icon: Icon, end }) => {
          const active = pathMatches(pathname, href, end);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-xl py-1 transition-colors duration-200 ${
                active ? activeAccent : "text-slate-500"
              }`}
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" strokeWidth={active ? 2.35 : 2} aria-hidden />
              <span className="max-w-full truncate px-0.5 text-[9px] font-semibold leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
