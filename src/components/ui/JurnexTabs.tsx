"use client";

import clsx from "clsx";
import { Check, IdCard, Mail, Sparkles } from "lucide-react";

type TabKey = "tripulacion" | "invitacion" | "experiencia";

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
  /** Misma lógica que `bundle.steps` (misiones de viaje por pestaña). */
  tabCompletion?: Partial<Record<TabKey, boolean>>;
};

export default function JurnexTabs({ active, onChange, tabCompletion }: Props) {
  const tabs = [
    { key: "tripulacion" as const, label: "Tripulación", icon: IdCard },
    { key: "invitacion" as const, label: "Invitación", icon: Mail },
    { key: "experiencia" as const, label: "Experiencia", icon: Sparkles },
  ];

  return (
    <div className="mb-6 w-full min-w-0">
      <p className="mb-2 text-xs text-white/50">Configurá las tres secciones del viaje</p>

      <div className="grid w-full grid-cols-3 gap-1.5 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          const done = tabCompletion?.[tab.key] === true;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={clsx(
                "flex w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-2 text-center transition-all sm:gap-1 sm:px-2.5 sm:py-2.5",
                isActive && !done && "border-teal-400/75 bg-teal-500/15 font-medium text-white shadow-[0_0_0_1px_rgba(45,212,191,0.2)]",
                isActive && done && "border-emerald-400/80 bg-gradient-to-b from-emerald-500/20 to-teal-500/10 font-medium text-white ring-1 ring-emerald-400/35",
                !isActive && done && "border-emerald-500/50 bg-emerald-500/10 text-white/90 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]",
                !isActive && !done && "border-white/10 bg-black/25 text-white/65 hover:border-white/20 hover:text-white"
              )}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                <Icon
                  className={clsx(
                    "h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4",
                    isActive && "text-teal-300",
                    !isActive && done && "text-emerald-300/90",
                    !isActive && !done && "opacity-75"
                  )}
                  aria-hidden
                />
                <span className="min-w-0 text-[11px] leading-tight sm:text-sm">{tab.label}</span>
                {done ? (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-emerald-400 sm:h-4 sm:w-4"
                    strokeWidth={2.5}
                    aria-label="Bloque completado"
                  />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
