"use client";

import clsx from "clsx";
import { FileText, Mail, Sparkles } from "lucide-react";

type TabKey = "datos" | "invitacion" | "experiencia";

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

export default function JurnexTabs({ active, onChange }: Props) {
  const tabs = [
    { key: "datos" as const, label: "Datos", icon: FileText },
    { key: "invitacion" as const, label: "Invitación", icon: Mail },
    { key: "experiencia" as const, label: "Experiencia", icon: Sparkles },
  ];

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs text-white/50">Configura tu viaje:</p>

      <div className="flex items-center gap-6 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={clsx(
                "flex items-center gap-2 pb-2 text-sm transition-all",
                isActive
                  ? "border-b-2 border-teal-400 font-medium text-white"
                  : "text-white/60 hover:border-b hover:border-white/20 hover:text-white"
              )}
            >
              <Icon
                className={clsx("h-4 w-4", isActive ? "text-teal-400 opacity-100" : "opacity-70")}
              />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
