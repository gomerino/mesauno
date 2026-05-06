"use client";

import type { EventoProgramaHito } from "@/types/database";
import { CalendarDays, X } from "lucide-react";
import { useEffect } from "react";

function formatHora(hora: string): string {
  return hora?.slice(0, 5) ?? "";
}

type Props = {
  open: boolean;
  onClose: () => void;
  hitos: EventoProgramaHito[];
};

export function SoftAviationItineraryDrawer({ open, onClose, hitos }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-itinerary-7600" role="presentation">
      <button
        type="button"
        aria-label="Cerrar itinerario"
        className="absolute inset-0 bg-invite-navy/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[min(88dvh,640px)] animate-slideUpDrawer rounded-t-3xl border border-invite-navy/10 bg-white text-invite-navy shadow-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="itinerario-drawer-title"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 pb-2 pt-4">
          <div className="flex items-center gap-2 text-invite-navy">
            <CalendarDays className="h-5 w-5 text-invite-navy/70" aria-hidden />
            <h2 id="itinerario-drawer-title" className="font-inviteSerif text-lg">
              Itinerario
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-invite-navy/45 transition hover:bg-invite-navy/5 hover:text-invite-navy"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-1 w-12 shrink-0 rounded-full bg-invite-navy/10 mx-auto mb-3" aria-hidden />

        <div className="overflow-x-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] [scrollbar-width:thin]">
          <ul className="flex snap-x snap-mandatory gap-3 pb-2">
            {hitos.map((h) => (
              <li
                key={h.id}
                className="w-[min(78vw,280px)] shrink-0 snap-start rounded-2xl border border-invite-navy/10 bg-invite-sand/70 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-invite-navy/45">Hora</p>
                <p className="mt-0.5 tabular-nums text-xl font-semibold text-invite-navy">{formatHora(h.hora)}</p>
                <p className="mt-2 font-inviteSerif text-base leading-snug text-invite-navy">{h.titulo}</p>
                {h.descripcion_corta ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-invite-navy/70">{h.descripcion_corta}</p>
                ) : null}
                {h.lugar_nombre ? (
                  <p className="mt-2 text-xs text-invite-navy/55">{h.lugar_nombre}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
