"use client";

import {
  JOURNEY_THEMES,
  type JourneyThemeId,
  persistJourneyTheme,
  readJourneyThemeFromStorage,
} from "@/theme/panel-themes";
import { useCallback, useEffect, useState } from "react";

/** @deprecated Usar {@link import("@/theme/panel-themes").JOURNEY_THEME_CHANGE_EVENT} */
export const PANEL_THEME_CHANGE_EVENT = "dreams:panel-theme-change";

export function PanelThemeSelector() {
  const [active, setActive] = useState<JourneyThemeId>("relax");

  useEffect(() => {
    setActive(readJourneyThemeFromStorage());
  }, []);

  const select = useCallback((id: JourneyThemeId) => {
    setActive(id);
    persistJourneyTheme(id);
  }, []);

  return (
    <section
      className="rounded-xl border border-white/[0.035] bg-black/20 p-3 shadow-none"
      aria-labelledby="panel-theme-heading"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="min-w-0 shrink-0 md:max-w-[14rem]">
          <h2 id="panel-theme-heading" className="font-display text-sm font-medium text-slate-300 sm:text-[15px]">
            Estilo de tu viaje ✨
          </h2>
          <p className="mt-0.5 text-xs leading-snug text-slate-500/90 sm:text-[13px]">
            Elige cómo se siente tu experiencia
          </p>
        </div>

        <div className="-mx-1 flex min-w-0 flex-nowrap gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] md:mx-0 md:flex-wrap md:justify-end md:overflow-visible md:pb-0">
          {JOURNEY_THEMES.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => select(t.id)}
                className={`min-h-[40px] shrink-0 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors duration-200 md:min-h-[44px] md:px-3.5 ${
                  on
                    ? "border-white/18 bg-white/[0.05] text-white ring-1 ring-white/10"
                    : "border-white/[0.06] bg-black/25 text-slate-400 hover:border-white/12 hover:bg-white/[0.03] hover:text-slate-300"
                } `}
                style={
                  on
                    ? { boxShadow: `inset 0 0 0 1px ${t.accent}22` }
                    : undefined
                }
              >
                <span className="block font-semibold leading-tight">{t.label}</span>
                <span className="mt-0.5 block text-[11px] font-normal leading-snug text-slate-500">{t.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
