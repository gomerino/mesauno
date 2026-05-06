"use client";

import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import type { WhatsappColaItem } from "@/components/panel/pasajeros/whatsapp-cola";
import { ChevronDown, MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  kind: "envio" | "insistir";
  items: WhatsappColaItem[];
  skippedSinTelefono: number;
};

const titulos: Record<Props["kind"], { h: string; p: string }> = {
  envio: {
    h: "Cada quien, su saludo en WhatsApp",
    p: "A cada toque, un chat listo con su invitación. Si tocas a muchos a la carrera, el móvil a veces frena: mejor uno tras otro.",
  },
  insistir: {
    h: "Recordar con cariño, por WhatsApp",
    p: "Llevar el mensaje a quien aún duda, con el recordatorio de asistencia. Un contacto a la vez, con calma, como el resto.",
  },
};

/** `whatsapp://` abre el handler del sistema; `wa.me` sigue yendo por navegador. */
function abrirEnlaceWhatsapp(href: string) {
  if (href.startsWith("whatsapp://")) {
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener noreferrer";
    a.target = "_self";
    a.setAttribute("style", "position:fixed;left:-9999px;width:0;height:0;opacity:0;pointer-events:none");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

/**
 * Cada apertura de chat es un toque, para respetar el ritmo en móvil.
 */
export function WhatsappEnviarColaModal({ open, onClose, kind, items, skippedSinTelefono }: Props) {
  const [index, setIndex] = useState(0);
  const abrirRef = useRef<HTMLButtonElement | null>(null);
  const cierreRef = useRef<HTMLButtonElement | null>(null);
  const descripcionId = useId();

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      if (items.length > 0) abrirRef.current?.focus();
      else cierreRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const abrirSiguiente = useCallback(() => {
    if (index >= items.length) return;
    const href = items[index].href;
    abrirEnlaceWhatsapp(href);
    setIndex((i) => i + 1);
  }, [index, items]);

  const abrirItem = useCallback((href: string) => {
    abrirEnlaceWhatsapp(href);
  }, []);

  if (!open) return null;

  const { h, p } = titulos[kind];
  const total = items.length;
  const restantes = total - index;
  const hecho = index >= total && total > 0;

  return (
    <div
      className="fixed inset-0 z-modals-200 flex items-end justify-center bg-black/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="wa-cola-titulo"
        aria-modal="true"
        aria-describedby={descripcionId}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-white/12 bg-jurnex-bg/95 p-4 shadow-2xl shadow-black/50 sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0" id={descripcionId}>
            <h2 id="wa-cola-titulo" className="text-base font-semibold text-white/95">
              {h}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-white/55">{p}</p>
            {skippedSinTelefono > 0 ? (
              <p className="mt-2 text-xs text-amber-200/80" role="status">
                {skippedSinTelefono === 1
                  ? "A alguien le hace falta un número bien puesto (con el código de país, si aplica) para abrirle el enlace. El resto, listo a seguir vuestro viaje con el botón de abajo."
                  : "A unas cuantas les falta un número claro. No se suman en este paso; aún les puedes hablar tú, con calma, aparte. El resto, a la mano con el botón o la lista."}
              </p>
            ) : null}
          </div>
          <button
            ref={cierreRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white/80"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {total === 0 ? (
          <p className="text-sm text-white/60">No pude abrir a nadie por aquí. Revisad en la ficha un número o probad otra tanda de invitados.</p>
        ) : hecho ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-200/90">
              Puedes cerrar cuando termines con el último. O si tocaste todo en la lista de abajo, también, listo.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-white/12 bg-white/[0.08] py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.12]"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/45">
              Sigue: <span className="text-white/75">{items[index]?.nombre}</span>
              {total > 1 ? (
                <span className="tabular-nums">
                  {" "}
                  ({index + 1} de {total})
                </span>
              ) : null}
            </p>
            <button
              ref={abrirRef}
              type="button"
              onClick={abrirSiguiente}
              className={panelCtaJurnexPrimary + " w-full justify-center gap-2 py-3"}
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span>Abrir en WhatsApp</span>
              {total > 1 && restantes > 0 ? (
                <span className="text-xs font-semibold text-slate-800/90 tabular-nums">
                  (faltan {restantes})
                </span>
              ) : null}
            </button>
            {items.length > 1 ? (
              <div className="rounded-lg border border-white/8 bg-white/[0.03]">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-2 text-left text-xs text-white/45">
                    <span>Ver a todos (abre uno a uno al tocar su nombre)</span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-white/35 transition group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <ul className="mt-0 max-h-40 space-y-1.5 overflow-y-auto border-t border-white/[0.05] px-2.5 pb-2.5 pr-0.5 pt-2 text-left" role="list">
                    {items.map((it) => (
                      <li key={it.id} role="listitem">
                        <button
                          type="button"
                          onClick={() => abrirItem(it.href)}
                          className="w-full rounded-md py-1 text-left text-sm text-teal-200/95 underline decoration-teal-500/30 underline-offset-2 hover:decoration-teal-400/50"
                        >
                          {it.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 text-center text-xs text-white/40 underline decoration-white/20 underline-offset-2 hover:text-white/60"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
