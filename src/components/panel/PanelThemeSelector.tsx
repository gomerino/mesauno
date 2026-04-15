"use client";

import { PANEL_THEME_STORAGE_KEY, PANEL_THEMES, type PanelThemeId } from "@/theme/panel-themes";
import { useCallback, useEffect, useState } from "react";

export const PANEL_THEME_CHANGE_EVENT = "dreams:panel-theme-change";

export function PanelThemeSelector() {
  const [active, setActive] = useState<PanelThemeId>("teal");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PANEL_THEME_STORAGE_KEY);
      if (raw === "teal" || raw === "gold" || raw === "rose") {
        setActive(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const select = useCallback((id: PanelThemeId) => {
    setActive(id);
    try {
      localStorage.setItem(PANEL_THEME_STORAGE_KEY, id);
      window.dispatchEvent(new Event(PANEL_THEME_CHANGE_EVENT));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <section
      className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
      aria-labelledby="panel-theme-heading"
    >
      <h2 id="panel-theme-heading" className="font-display text-base font-semibold text-white">
        Tono del panel
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Solo cambia colores de acento aquí dentro. Tu invitación pública no se modifica.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {PANEL_THEMES.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              className={`min-h-[44px] rounded-xl border px-4 py-2 text-left text-sm font-medium transition ${
                on
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/5"
              }`}
              style={{ boxShadow: on ? `0 0 0 1px ${t.accent}55` : undefined }}
            >
              <span className="block font-semibold">{t.label}</span>
              <span className="block text-xs font-normal text-slate-500">{t.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
