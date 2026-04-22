"use client";

import clsx from "clsx";
import { useState } from "react";

export type JurnexEditableCardProps = {
  title: string;
  status?: string | null;
  children: React.ReactNode;
  preview: React.ReactNode;
  /** Modo controlado: si se pasa `open`, hay que pasar `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function JurnexEditableCard({
  title,
  status,
  children,
  preview,
  open: controlledOpen,
  onOpenChange,
}: JurnexEditableCardProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? Boolean(controlledOpen) : internalOpen;

  function setOpen(next: boolean) {
    if (controlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  function toggle() {
    setOpen(!open);
  }

  return (
    <div
      className={clsx(
        "rounded-lg border border-white/10 bg-black/30 p-4 transition-all",
        "hover:border-white/20"
      )}
    >
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          {status ? <span className="text-xs text-teal-400">{status}</span> : null}
        </div>
        <span className="text-xs text-white/40">{open ? "Cerrar" : "Editar"}</span>
      </div>

      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
        {open ? children : preview}
      </div>
    </div>
  );
}
