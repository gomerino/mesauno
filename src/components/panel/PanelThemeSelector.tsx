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
    <div
      className="inline-flex w-full max-w-full min-h-[36px] max-h-11 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-3 pr-2 md:w-auto md:max-w-none md:min-h-[38px] md:max-h-[44px] md:py-2"
      role="group"
      aria-label="Temas del viaje"
    >
      <span className="shrink-0 text-xs font-medium text-slate-400">Temas ✨</span>
      <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch] sm:justify-start md:flex-none md:justify-start">
        {JOURNEY_THEMES.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              aria-pressed={on}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                on
                  ? "border border-white/20 bg-white/10 text-white"
                  : "border border-transparent bg-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-slate-300"
              }`}
            >
              {t.chipLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
