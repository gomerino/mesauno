"use client";

import { Check, Circle } from "lucide-react";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type Props = {
  items: ChecklistItem[];
  onToggle?: (id: string) => void;
  readOnly?: boolean;
};

export function Checklist({ items, onToggle, readOnly }: Props) {
  return (
    <ul className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={readOnly || !onToggle}
            onClick={() => onToggle?.(item.id)}
            className={`flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
              onToggle && !readOnly ? "hover:bg-white/5" : ""
            } disabled:cursor-default`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                item.done
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                  : "border-white/20 text-slate-500"
              }`}
              aria-hidden
            >
              {item.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Circle className="h-3.5 w-3.5" />}
            </span>
            <span className={item.done ? "text-slate-400 line-through" : "font-medium text-white"}>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
