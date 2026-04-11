"use client";

import { Music2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Rsvp = "confirmado" | "declinado" | "pendiente";

type Props = {
  invitadoId: string;
  initialEstado: string | null;
  initialRestricciones: string;
  spotifyPlaylistUrl: string | null;
  onClose: () => void;
  /** Tras guardar correctamente en `/api/rsvp` (actualiza CTA en el shell). */
  onRsvpSaved?: (estado: Rsvp) => void;
};

const TAG_GLUTEN = "Sin gluten";
const TAG_VEGANO = "Vegano";
const TAG_FRUTOS = "Alergia a frutos secos";

function parseInitialTags(text: string): { gluten: boolean; vegano: boolean; frutos: boolean; free: string } {
  const lower = text.toLowerCase();
  const gluten = lower.includes("gluten") || lower.includes(TAG_GLUTEN.toLowerCase());
  const vegano = lower.includes("vegano");
  const frutos = lower.includes("fruto") || lower.includes("frutos secos");
  let free = text;
  [TAG_GLUTEN, TAG_VEGANO, TAG_FRUTOS, "sin gluten"].forEach((t) => {
    free = free.replace(new RegExp(t, "gi"), "");
  });
  free = free.replace(/[,;]\s*,/g, ",").replace(/^[,;\s]+|[,;\s]+$/g, "").trim();
  return { gluten, vegano, frutos, free };
}

export function SoftAviationCheckInFlow({
  invitadoId,
  initialEstado,
  initialRestricciones,
  spotifyPlaylistUrl,
  onClose,
  onRsvpSaved,
}: Props) {
  const router = useRouter();
  const initialRsvp: Rsvp =
    initialEstado === "confirmado" || initialEstado === "declinado" || initialEstado === "pendiente"
      ? initialEstado
      : "pendiente";

  const [step, setStep] = useState(1);
  const [rsvp, setRsvp] = useState<Rsvp>(initialRsvp);
  const initTags = useMemo(() => parseInitialTags(initialRestricciones), [initialRestricciones]);
  const [gluten, setGluten] = useState(initTags.gluten);
  const [vegano, setVegano] = useState(initTags.vegano);
  const [frutos, setFrutos] = useState(initTags.frutos);
  const [notaLibre, setNotaLibre] = useState(initTags.free);
  const [sugerenciaMusica, setSugerenciaMusica] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const buildRestricciones = useCallback(() => {
    const parts: string[] = [];
    if (gluten) parts.push(TAG_GLUTEN);
    if (vegano) parts.push(TAG_VEGANO);
    if (frutos) parts.push(TAG_FRUTOS);
    const free = notaLibre.trim();
    if (free) parts.push(free);
    if (sugerenciaMusica.trim()) parts.push(`Sugerencia música: ${sugerenciaMusica.trim()}`);
    return parts.length ? parts.join(", ") : "";
  }, [gluten, vegano, frutos, notaLibre, sugerenciaMusica]);

  const submit = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitadoId,
          rsvp_estado: rsvp,
          restricciones_alimenticias: buildRestricciones() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      onRsvpSaved?.(rsvp);
      setDone(true);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }, [buildRestricciones, invitadoId, onRsvpSaved, router, rsvp]);

  const shell = (
    <div
      className="fixed inset-0 z-[9200] flex h-[100dvh] max-h-[100dvh] min-h-0 animate-fadeIn flex-col overflow-hidden bg-[#F4F1EA] text-[#1A2B48]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-[#1A2B48]/5 bg-[#F4F1EA] px-4 py-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div>
          <h2 id="checkin-title" className="font-inviteSerif text-xl text-[#1A2B48]">
            Confirmar asistencia
          </h2>
          {!done ? (
            <p className="text-xs text-[#1A2B48]/55">
              Paso {step} de 4
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2.5 text-[#1A2B48]/50 transition hover:bg-[#1A2B48]/5 hover:text-[#1A2B48]"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {!done ? (
        <div className="mx-4 mt-3 flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[#D4AF37]" : "bg-[#1A2B48]/10"}`}
            />
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
        {err ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
        ) : null}

        {done ? (
          <div className="flex flex-col items-center py-10">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-[#D4AF37]/90 bg-white text-center font-inviteSerif text-sm font-bold uppercase leading-tight text-[#1A2B48] animate-stampDrop">
              Confirmado
            </div>
            <p className="mt-6 max-w-xs text-center text-sm text-[#1A2B48]/70">¡Gracias! Tu respuesta ya está registrada.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 rounded-full bg-[#D4AF37] px-10 py-3 text-sm font-semibold text-[#1A2B48] transition hover:brightness-105"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#1A2B48]">¿Nos acompañas en el viaje?</p>
                {(
                  [
                    { v: "confirmado" as const, label: "Sí, ahí estaré" },
                    { v: "pendiente" as const, label: "Aún no lo tengo claro" },
                    { v: "declinado" as const, label: "No podré asistir" },
                  ] as const
                ).map((o) => (
                  <label
                    key={o.v}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition ${
                      rsvp === o.v
                        ? "border-[#D4AF37] bg-white text-[#1A2B48]"
                        : "border-[#1A2B48]/5 bg-white text-[#1A2B48]/80 hover:border-[#1A2B48]/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rsvp-soft"
                      checked={rsvp === o.v}
                      onChange={() => setRsvp(o.v)}
                      className="h-4 w-4 accent-[#D4AF37]"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-[#1A2B48]/75">Marca lo que aplique para el catering.</p>
                {[
                  { id: "g", label: TAG_GLUTEN, checked: gluten, set: setGluten, emoji: "🌾" },
                  { id: "v", label: TAG_VEGANO, checked: vegano, set: setVegano, emoji: "🥗" },
                  { id: "f", label: TAG_FRUTOS, checked: frutos, set: setFrutos, emoji: "🥜" },
                ].map((row) => (
                  <label
                    key={row.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      row.checked
                        ? "border-[#D4AF37] bg-white"
                        : "border-[#1A2B48]/5 bg-white hover:border-[#1A2B48]/12"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={(e) => row.set(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#D4AF37]"
                    />
                    <span className="text-xl" aria-hidden>
                      {row.emoji}
                    </span>
                    <span className="text-sm font-medium text-[#1A2B48]">{row.label}</span>
                  </label>
                ))}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#1A2B48]/45">
                    Otras notas
                  </label>
                  <textarea
                    value={notaLibre}
                    onChange={(e) => setNotaLibre(e.target.value)}
                    rows={3}
                    placeholder="Ej: intolerancia a lactosa…"
                    className="mt-1 w-full resize-none rounded-2xl border border-[#1A2B48]/5 bg-white px-3 py-2 text-sm text-[#1A2B48] outline-none ring-[#D4AF37]/35 focus:ring-2"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-[#1A2B48]/75">¿Qué canción no puede faltar en el viaje?</p>
                <input
                  type="text"
                  value={sugerenciaMusica}
                  onChange={(e) => setSugerenciaMusica(e.target.value)}
                  placeholder="Artista — canción"
                  className="w-full rounded-full border border-[#1A2B48]/5 bg-white px-4 py-3 text-sm text-[#1A2B48] outline-none ring-[#D4AF37]/35 focus:ring-2"
                />
                {spotifyPlaylistUrl ? (
                  <a
                    href={spotifyPlaylistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1DB954] py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    <Music2 className="h-5 w-5" />
                    Abrir playlist en Spotify
                  </a>
                ) : null}
                <p className="text-xs text-[#1A2B48]/45">La sugerencia se guardará al confirmar tu asistencia.</p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-sm text-[#1A2B48]/75">
                <p>Resumen</p>
                <ul className="list-inside list-disc rounded-2xl border border-[#1A2B48]/5 bg-white px-4 py-3 text-[#1A2B48]">
                  <li>
                    Asistencia:{" "}
                    {rsvp === "confirmado" ? "Sí" : rsvp === "declinado" ? "No" : "Pendiente"}
                  </li>
                  <li>Restricciones: {buildRestricciones() || "Ninguna indicada"}</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {!done ? (
        <footer className="shrink-0 border-t border-[#1A2B48]/5 bg-[#F4F1EA]/95 px-4 py-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-lg flex-wrap gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="rounded-full border border-[#1A2B48]/10 px-5 py-2.5 text-sm font-medium text-[#1A2B48] transition hover:bg-[#1A2B48]/5"
              >
                Atrás
              </button>
            ) : null}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="ml-auto rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#1A2B48] transition hover:brightness-105"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => void submit()}
                className="ml-auto rounded-full bg-[#D4AF37] px-8 py-2.5 text-sm font-semibold text-[#1A2B48] transition hover:brightness-105 disabled:opacity-50"
              >
                {loading ? "Guardando…" : "Confirmar asistencia"}
              </button>
            )}
          </div>
        </footer>
      ) : null}
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(shell, document.body);
}
