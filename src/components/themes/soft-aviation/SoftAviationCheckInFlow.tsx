"use client";

import { useAviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";
import { Music2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getAviationRsvpCheckinUi,
  rsvpExitoPista,
  rsvpExitoTitulo,
} from "@/lib/aviation-rsvp-checkin-ui";
import { formatFechaDDMMMYY } from "@/lib/format-fecha-evento";

type Rsvp = "confirmado" | "declinado" | "pendiente";

const SOFT_RSVP_STEPS = ["Confirmar asistencia", "Catering", "Música", "Revisar"] as const;

type Props = {
  invitadoId: string;
  initialEstado: string | null;
  initialRestricciones: string;
  fechaEvento: string | null | undefined;
  planKind?: "esencial" | "experiencia" | null;
  spotifyPlaylistUrl: string | null;
  onClose: () => void;
  /** Tras guardar correctamente en `/api/rsvp` (actualiza CTA en el shell). */
  onRsvpSaved?: (estado: Rsvp) => void;
  /** `details`: registro independiente de restricciones desde navegación. */
  flowMode?: "create" | "edit" | "details";
};

const TAG_GLUTEN = "Sin gluten";
const TAG_VEGANO = "Vegano";
const TAG_FRUTOS = "Alergia a frutos secos";
const TAG_PESCADOS_MARISCOS = "Alergia a pescados y mariscos";

function parseInitialTags(text: string): {
  gluten: boolean;
  vegano: boolean;
  frutos: boolean;
  pescadosMariscos: boolean;
  free: string;
} {
  const lower = text.toLowerCase();
  const gluten = lower.includes("gluten") || lower.includes(TAG_GLUTEN.toLowerCase());
  const vegano = lower.includes("vegano");
  const frutos = lower.includes("fruto") || lower.includes("frutos secos");
  const pescadosMariscos =
    lower.includes("pescado") ||
    lower.includes("pescados") ||
    lower.includes("marisco") ||
    lower.includes("mariscos");
  let free = text;
  [TAG_GLUTEN, TAG_VEGANO, TAG_FRUTOS, TAG_PESCADOS_MARISCOS, "sin gluten"].forEach((t) => {
    free = free.replace(new RegExp(t, "gi"), "");
  });
  free = free.replace(/[,;]\s*,/g, ",").replace(/^[,;\s]+|[,;\s]+$/g, "").trim();
  return { gluten, vegano, frutos, pescadosMariscos, free };
}

export function SoftAviationCheckInFlow({
  invitadoId,
  initialEstado,
  initialRestricciones,
  fechaEvento,
  planKind = null,
  spotifyPlaylistUrl,
  onClose,
  onRsvpSaved,
  flowMode = "create",
}: Props) {
  const variant = useAviationInvitacionVariant();
  const c = useMemo(() => getAviationRsvpCheckinUi(variant), [variant]);
  const isJurnex = variant === "jurnex";
  const isDetailsMode = isJurnex && flowMode === "details";

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
  const [pescadosMariscos, setPescadosMariscos] = useState(initTags.pescadosMariscos);
  const [notaLibre, setNotaLibre] = useState(initTags.free);
  const [sugerenciaMusica, setSugerenciaMusica] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fechaSello = useMemo(() => formatFechaDDMMMYY(fechaEvento, "FECHA POR CONFIRMAR"), [fechaEvento]);

  const mensajeExitoRsvp = useMemo(() => {
    if (isDetailsMode) {
      return "Guardamos tus preferencias para que el equipo del evento las tenga a mano.";
    }
    if (rsvp === "confirmado") return "Tu pase quedó validado. Nos vemos a bordo.";
    if (rsvp === "declinado") {
      return "Gracias por avisar. La pareja verá tu respuesta en el manifiesto.";
    }
    return "Guardamos tu respuesta como pendiente. Puedes cambiarla desde esta invitación.";
  }, [isDetailsMode, rsvp]);

  const successHint = useMemo(() => {
    if (isDetailsMode) return "Puedes volver al pase y seguir navegando la invitación.";
    if (rsvp === "confirmado" && planKind === "experiencia") {
      return "Ahora puedes aportar a la playlist. El día del evento también podrás subir fotos a la bitácora.";
    }
    if (rsvp === "confirmado") return "Explora el pase, la carta y el plan del evento cuando quieras.";
    return rsvpExitoPista(rsvp);
  }, [isDetailsMode, planKind, rsvp]);

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
    if (pescadosMariscos) parts.push(TAG_PESCADOS_MARISCOS);
    const free = notaLibre.trim();
    if (free) parts.push(free);
    if (sugerenciaMusica.trim()) parts.push(`Sugerencia música: ${sugerenciaMusica.trim()}`);
    return parts.length ? parts.join(", ") : "";
  }, [gluten, vegano, frutos, pescadosMariscos, notaLibre, sugerenciaMusica]);

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
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          /* noop */
        }
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }, [buildRestricciones, invitadoId, onRsvpSaved, router, rsvp]);

  const tituloHeader = done
    ? "Confirmación de asistencia guardada"
    : isDetailsMode
      ? "Preferencias alimenticias"
      : flowMode === "edit"
        ? "Editar confirmación de asistencia (RSVP)"
        : "Confirmar asistencia (RSVP)";

  const steps = isJurnex ? ["Confirmar asistencia"] : SOFT_RSVP_STEPS;
  const totalSteps = steps.length;
  const stepLabelJx = isDetailsMode ? "Catering" : "Sellar pase";
  const goNext = useCallback(() => {
    if (isJurnex) {
      void submit();
      return;
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  }, [isJurnex, submit, totalSteps]);

  const nextLabel = useMemo(() => {
    if (isJurnex) {
      if (loading) return isDetailsMode ? "Guardando..." : "Sellando...";
      if (isDetailsMode) return "Guardar preferencias";
      if (rsvp === "confirmado") return flowMode === "edit" ? "Guardar y sellar" : "Sellar asistencia";
      return "Guardar respuesta";
    }
    if (step < totalSteps) return "Siguiente";
    if (loading) return "Guardando...";
    return flowMode === "edit" ? "Guardar cambios" : "Confirmar asistencia";
  }, [flowMode, isDetailsMode, isJurnex, loading, rsvp, step, totalSteps]);

  const shell = (
    <div
      className={c.page}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      style={{
        backgroundColor: isJurnex ? "#F4F0E8" : "#F9F6F0",
        zIndex: 2147483647,
      }}
    >
      <header
        className={
          c.header + (isJurnex ? " sm:px-6" : "") + " flex shrink-0 items-center justify-between gap-3"
        }
      >
        <div className="min-w-0 flex-1 pr-1">
          <h2
            id="checkin-title"
            className={done ? c.h2Done : c.h2}
          >
            {tituloHeader}
          </h2>
          {!done ? (
            <p className={c.stepPill + (isJurnex ? " mt-1.5" : " mt-0.5")}>
              {isJurnex ? (
                <>
                  {isDetailsMode ? "Registro de catering" : "Respuesta de embarque"}
                  {stepLabelJx ? <span className="text-inviteJurnex-navy/50"> — </span> : null}
                  {stepLabelJx ? <span className="text-inviteJurnex-navy/80">{stepLabelJx}</span> : null}
                </>
              ) : (
                <>Paso {step} de 4</>
              )}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={c.closeBtn + " shrink-0"}
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {!done && !isJurnex ? (
        <div className="bg-white/80 px-4 py-2">
          <div className="mx-auto flex max-w-lg gap-1.5 sm:px-0">
            {SOFT_RSVP_STEPS.map((_, i) => {
              const s = i + 1;
              return (
              <div
                key={s}
                className={`h-1.5 min-h-[4px] flex-1 rounded-full ${s <= step ? c.stepOn : c.stepOff}`}
                aria-hidden
              />
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={c.body}>
        {err ? <p className={c.err}>{err}</p> : null}

        {done ? (
          <div className={c.successBlock}>
            <p className={c.successKicker}>Respuesta registrada</p>
            {isJurnex ? (
              <div className={c.successTicket}>
                <div className={c.successTicketGlow} aria-hidden />
                <div className="relative z-10 px-3 py-5">
                  <div className="mx-auto flex min-h-[13rem] max-w-[18rem] items-center justify-center rounded-2xl border-2 border-dashed border-inviteJurnex-navy/12 bg-inviteJurnex-cream/80 p-5">
                    <div
                      className="-rotate-6 rounded-[2rem] border-[3px] border-inviteJurnex-gold/90 bg-white/80 px-5 py-4 text-center shadow-jurnex-glow animate-stampDrop motion-reduce:animate-none"
                      aria-label={`Sello de aduanas: ${rsvp === "confirmado" ? "confirmado" : "registrado"}, ${fechaSello}`}
                    >
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-inviteJurnex-navy/55">
                        Aduanas Jurnex
                      </p>
                      <p className="mt-2 font-display text-[2rem] font-black uppercase leading-none tracking-[-0.04em] text-inviteJurnex-navy">
                        {isDetailsMode ? "Catering" : rsvp === "confirmado" ? "Confirmado" : "Registrado"}
                      </p>
                      <div className="mx-auto my-3 h-px w-28 bg-inviteJurnex-gold/70" aria-hidden />
                      <p className="font-mono text-[1.1rem] font-bold uppercase tracking-[0.16em] text-inviteJurnex-gold">
                        {fechaSello}
                      </p>
                      <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.24em] text-inviteJurnex-navy/45">
                        Pase validado
                      </p>
                    </div>
                  </div>
                  <h3 className={c.successH3}>{rsvpExitoTitulo(rsvp)}</h3>
                  <p className={c.successBody}>{mensajeExitoRsvp}</p>
                  <p className={c.successHint}>{successHint}</p>
                </div>
              </div>
            ) : (
              <div className={c.successTicket}>
                <div className={c.successTicketGlow} aria-hidden />
                <div className="relative z-10">
                  <div className={c.successSelloFrame}>
                    <div className={c.successSelloBar} aria-hidden />
                    <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-1.5">
                      <div className={c.successSelloCheckOuter}>
                        <span className={c.successSelloCheckInner} aria-hidden>
                          ✓
                        </span>
                      </div>
                      <p className={c.successStampWord}>Validado</p>
                    </div>
                  </div>
                  <h3 className={c.successH3}>{rsvpExitoTitulo(rsvp)}</h3>
                  <p className={c.successBody}>{mensajeExitoRsvp}</p>
                  <p className={c.successHint}>{successHint}</p>
                </div>
              </div>
            )}
            <button type="button" onClick={onClose} className={c.ctaSolo + " mx-auto block"}>
              Volver a la invitación
            </button>
          </div>
        ) : (
          <div
            className={
              isJurnex
                ? "mx-auto w-full max-w-lg rounded-2xl border-2 border-inviteJurnex-navy/8 bg-white p-4 shadow-[0_12px_40px_-16px_rgba(2,24,42,0.12)] sm:p-5"
                : "contents"
            }
          >
            {step === 1 && !isDetailsMode && (
              <div className="space-y-3">
                <div>
                  <p className={c.pLead}>¿Nos acompañas en la celebración?</p>
                  {isJurnex ? (
                    <p className="mt-1 text-sm leading-relaxed text-inviteJurnex-navy/65">
                      Una respuesta y listo. Si necesitas dejar restricciones, podrás hacerlo desde Dietas en la barra.
                    </p>
                  ) : null}
                </div>
                {(
                  [
                    {
                      v: "confirmado" as const,
                      label: "Sí, asistiré",
                      detail: "Sellar mi pase",
                    },
                    {
                      v: "declinado" as const,
                      label: "No podré asistir",
                      detail: "Avisar con cariño a la pareja",
                    },
                    {
                      v: "pendiente" as const,
                      label: "Aún no lo tengo claro",
                      detail: "Guardar como pendiente",
                    },
                  ] as const
                ).map((o) => (
                  <label
                    key={o.v}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition ${
                      rsvp === o.v ? c.radioOn : c.radioOff
                    }`}
                  >
                    <input
                      type="radio"
                      name="rsvp-soft"
                      checked={rsvp === o.v}
                      onChange={() => setRsvp(o.v)}
                      className={c.radioInput}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold">{o.label}</span>
                      {isJurnex ? (
                        <span className="mt-0.5 block text-xs font-medium text-inviteJurnex-navy/55">{o.detail}</span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {(step === 2 || isDetailsMode) && (
              <div className="space-y-4">
                <div>
                  <p className={c.pLead}>{isJurnex ? "Restricciones alimenticias" : "Catering"}</p>
                  <p className={c.pMuted}>
                    {isJurnex
                      ? "Cuéntanos solo lo importante para el catering. Esto queda asociado a tu pase."
                      : "Marca lo que aplique para el catering."}
                  </p>
                </div>
                {[
                  { id: "g", label: TAG_GLUTEN, checked: gluten, set: setGluten, emoji: "🌾" },
                  { id: "v", label: TAG_VEGANO, checked: vegano, set: setVegano, emoji: "🥗" },
                  { id: "f", label: TAG_FRUTOS, checked: frutos, set: setFrutos, emoji: "🥜" },
                  {
                    id: "p",
                    label: TAG_PESCADOS_MARISCOS,
                    checked: pescadosMariscos,
                    set: setPescadosMariscos,
                    emoji: "🐟",
                  },
                ].map((row) => (
                  <label
                    key={row.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      row.checked ? c.checkOn : c.checkOff
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={(e) => row.set(e.target.checked)}
                      className={c.checkInput}
                    />
                    <span className="text-xl" aria-hidden>
                      {row.emoji}
                    </span>
                    <span className={c.checkLabel}>{row.label}</span>
                  </label>
                ))}
                <div>
                  <label className={c.fieldLabel}>
                    Otras notas
                  </label>
                  <textarea
                    value={notaLibre}
                    onChange={(e) => setNotaLibre(e.target.value)}
                    rows={3}
                    placeholder="Ej: intolerancia a lactosa…"
                    className={c.textArea}
                  />
                </div>
              </div>
            )}

            {step === 3 && !isJurnex && (
              <div className="space-y-4">
                <p className={c.pMuted}>¿Qué canción no puede faltar?</p>
                <input
                  type="text"
                  value={sugerenciaMusica}
                  onChange={(e) => setSugerenciaMusica(e.target.value)}
                  placeholder="Artista — canción"
                  className={c.textInput}
                />
                {spotifyPlaylistUrl ? (
                  <a
                    href={spotifyPlaylistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-spotify-brand py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    <Music2 className="h-5 w-5" aria-hidden />
                    Abrir playlist en Spotify
                  </a>
                ) : null}
                <p className="text-xs text-invite-navy/45">
                  La sugerencia se guardará al confirmar tu asistencia.
                </p>
              </div>
            )}

            {step === 4 && !isJurnex && (
              <div className="space-y-4 text-sm text-invite-navy/75">
                <p className={c.pLead}>Resumen</p>
                <ul className={c.resumenBox}>
                  <li>
                    Confirmación de asistencia (RSVP):{" "}
                    {rsvp === "confirmado" ? "Sí" : rsvp === "declinado" ? "No" : "Pendiente"}
                  </li>
                  <li>Restricciones: {buildRestricciones() || "Ninguna indicada"}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {!done ? (
        <footer className={c.footer}>
          <div
            className={`mx-auto flex w-full max-w-lg gap-2.5 ${
              isJurnex ? "flex-row items-stretch" : "flex-wrap items-center"
            }`}
          >
            {step > 1 && !isDetailsMode ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className={c.backBtn}
              >
                Atrás
              </button>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={step < totalSteps || isJurnex ? goNext : () => void submit()}
              className={`${c.nextBtn} ${loading ? "disabled:cursor-not-allowed" : ""} disabled:opacity-50`}
            >
              {nextLabel}
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(shell, document.body);
}
