"use client";

import type { Evento } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import {
  INVITACION_THEMES,
  type InvitacionThemeId,
  resolveInvitacionThemeId,
} from "@/lib/invitacion-theme";
import { InvitationThemePicker } from "@/components/panel/InvitationThemePicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const label = "block text-xs font-medium text-slate-400";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-teal-500 focus:ring-2";

const card = "rounded-xl border border-white/10 bg-black/20 p-4";
const summaryText = "text-sm text-slate-300";
const sectionLabel = "text-[11px] uppercase tracking-wide text-slate-500";

type SectionId = "basica" | "ubicacion" | "mensaje" | "detalles" | "estilo";

type Props = {
  initial: Evento | null;
};

function fechaInput(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  return s.length === 10 ? s : "";
}

function formatDate(v: string): string {
  if (!v) return "Sin fecha";
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

type SectionStatus = {
  done: boolean;
  missing: string[];
};

/** Señala un chip redondo según el estado del bloque. */
function StatusChip({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
        aria-label="Sección completa"
      >
        <span aria-hidden>✓</span> Listo
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200"
      aria-label="Sección pendiente"
    >
      <span aria-hidden>●</span> Pendiente
    </span>
  );
}

export function EventoForm({ initial }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<SectionId | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [nombre_novio_1, setN1] = useState(initial?.nombre_novio_1 ?? "");
  const [nombre_novio_2, setN2] = useState(initial?.nombre_novio_2 ?? "");
  const [fecha_principal, setFechaPrincipal] = useState(
    fechaInput(initial?.fecha_evento) || fechaInput(initial?.fecha_boda)
  );
  const [nombre_evento, setNombreEvento] = useState(initial?.nombre_evento ?? "Boda Dreams");
  const [destino, setDestino] = useState(initial?.destino ?? "");
  const [lugar_evento_linea, setLugarLinea] = useState(initial?.lugar_evento_linea ?? "");
  const [codigo_vuelo, setCodigo] = useState(initial?.codigo_vuelo ?? "");
  const [hora_embarque, setHora] = useState(initial?.hora_embarque ?? "12:00");
  const [puerta, setPuerta] = useState(initial?.puerta ?? "");
  const [asiento_default, setAsiento] = useState(initial?.asiento_default ?? "");
  const [motivo_viaje, setMotivo] = useState(initial?.motivo_viaje ?? "");
  const initialThemeId = resolveInvitacionThemeId(
    { evento: initial, invitado: null },
    null
  );
  const [theme_id, setThemeId] = useState<InvitacionThemeId>(initialThemeId);
  const [pendingThemeId, setPendingThemeId] = useState<InvitacionThemeId>(initialThemeId);

  useEffect(() => {
    if (!editing) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const frame = requestAnimationFrame(() => {
      const root = editorRef.current;
      if (!root) return;
      const fields = Array.from(
        root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          "input, textarea"
        )
      );
      const firstEmpty = fields.find((el) => !el.value || el.value.trim() === "");
      const target = firstEmpty ?? fields[0];
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [editing]);

  function openSection(id: SectionId) {
    setEditing(id);
    if (id === "estilo") {
      setPendingThemeId(theme_id);
    }
    trackEvent("evento_section_opened", { section: id });
  }

  async function persistThemeChange() {
    if (!initial?.id) {
      setErr("Primero completa la información básica del evento.");
      return;
    }
    const next = pendingThemeId;
    if (next === theme_id) {
      setEditing(null);
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await supabase.rpc("apply_evento_theme", {
      p_evento_id: initial.id,
      p_theme_id: next,
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setThemeId(next);
    router.refresh();
    setEditing(null);
    trackEvent("evento_section_saved", { section: "estilo" });
    trackEvent("invitation_theme_changed", {
      theme_id: next,
      source: "panel_evento",
    });
    toast.success("Estilo aplicado a todas las invitaciones ✨");
  }

  async function persistChanges() {
    if (editing === "estilo") {
      await persistThemeChange();
      return;
    }

    setSaving(true);
    setErr(null);
    const row = {
      nombre_novio_1: nombre_novio_1.trim() || null,
      nombre_novio_2: nombre_novio_2.trim() || null,
      fecha_boda: fecha_principal.trim() || null,
      nombre_evento: nombre_evento.trim() || null,
      fecha_evento: fecha_principal.trim() || null,
      destino: destino.trim() || null,
      lugar_evento_linea: lugar_evento_linea.trim() || null,
      codigo_vuelo: codigo_vuelo.trim() || null,
      hora_embarque: hora_embarque.trim() || null,
      puerta: puerta.trim() || null,
      asiento_default: asiento_default.trim() || null,
      motivo_viaje: motivo_viaje.trim() || null,
    };

    const savedSection = editing;

    if (initial?.id) {
      const { error } = await supabase.from("eventos").update(row).eq("id", initial.id);
      setSaving(false);
      if (error) {
        setErr(error.message);
        return;
      }
      router.refresh();
      setEditing(null);
      if (savedSection) trackEvent("evento_section_saved", { section: savedSection });
      toast.success("Cambios guardados ✨");
      return;
    }

    const { error } = await supabase.from("eventos").insert(row);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
    setEditing(null);
    if (savedSection) trackEvent("evento_section_saved", { section: savedSection });
    toast.success("Cambios guardados ✨");
  }

  const basicaStatus: SectionStatus = (() => {
    const missing: string[] = [];
    if (!nombre_novio_1.trim()) missing.push("nombre 1");
    if (!nombre_novio_2.trim()) missing.push("nombre 2");
    if (!fecha_principal.trim()) missing.push("fecha");
    return { done: missing.length === 0, missing };
  })();

  const ubicacionStatus: SectionStatus = (() => {
    const missing: string[] = [];
    if (!destino.trim()) missing.push("dirección");
    if (!lugar_evento_linea.trim()) missing.push("nombre del lugar");
    return { done: missing.length === 0, missing };
  })();

  const mensajeStatus: SectionStatus = {
    done: motivo_viaje.trim().length > 0,
    missing: motivo_viaje.trim().length > 0 ? [] : ["mensaje"],
  };

  const detallesStatus: SectionStatus = {
    done: [codigo_vuelo, asiento_default, puerta].some((v) => v.trim().length > 0),
    missing: [],
  };

  const estiloStatus: SectionStatus = { done: true, missing: [] };
  const currentThemeMeta =
    INVITACION_THEMES.find((t) => t.id === theme_id) ?? INVITACION_THEMES[0];

  const basicSummary = [
    [nombre_novio_1, nombre_novio_2].filter(Boolean).join(" & ") || "Nombres pendientes",
    nombre_evento || "Nombre del evento pendiente",
    `${formatDate(fecha_principal)}${hora_embarque ? ` · ${hora_embarque}` : ""}`,
  ];
  const locationSummary = [
    destino || "Dirección pendiente",
    lugar_evento_linea || "Nombre del lugar sin definir",
  ];
  const messageSummary = motivo_viaje?.trim()
    ? motivo_viaje.trim()
    : "Todavía no agregaste mensaje para tus invitados.";
  const detailsSummary = [
    `Código: ${codigo_vuelo || "—"}`,
    `Asiento: ${asiento_default || "—"}`,
    `Puerta: ${puerta || "—"}`,
  ];

  function ctaLabel(s: SectionStatus): string {
    return s.done ? "Editar" : "Completar";
  }

  function renderEditor() {
    switch (editing) {
      case "basica":
        return (
          <div className="space-y-6">
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Personas</p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Nombre 1</label>
                  <input className={input} value={nombre_novio_1} onChange={(e) => setN1(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Nombre 2</label>
                  <input className={input} value={nombre_novio_2} onChange={(e) => setN2(e.target.value)} />
                </div>
              </div>
            </section>
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Evento</p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={label}>Nombre del evento</label>
                  <input className={input} value={nombre_evento} onChange={(e) => setNombreEvento(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Fecha</label>
                  <input
                    className={input}
                    type="date"
                    value={fecha_principal}
                    onChange={(e) => setFechaPrincipal(e.target.value)}
                  />
                </div>
                <div>
                  <label className={label}>Hora</label>
                  <input className={input} value={hora_embarque} onChange={(e) => setHora(e.target.value)} />
                </div>
              </div>
            </section>
          </div>
        );
      case "ubicacion":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Dirección</label>
              <input
                className={input}
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Calle, ciudad o referencia"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Nombre del lugar</label>
              <input
                className={input}
                value={lugar_evento_linea}
                onChange={(e) => setLugarLinea(e.target.value)}
                placeholder="Opcional · ej. centro de eventos"
              />
            </div>
          </div>
        );
      case "mensaje":
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={label}>Mensaje a invitados</label>
              <textarea
                rows={4}
                value={motivo_viaje}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Una línea o un párrafo corto para la invitación."
                className={`${input} min-h-[88px] resize-y`}
              />
            </div>
          </div>
        );
      case "detalles":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Código vuelo</label>
              <input className={input} value={codigo_vuelo} onChange={(e) => setCodigo(e.target.value)} placeholder="—" />
            </div>
            <div>
              <label className={label}>Asiento</label>
              <input className={input} value={asiento_default} onChange={(e) => setAsiento(e.target.value)} placeholder="—" />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Puerta</label>
              <input className={input} value={puerta} onChange={(e) => setPuerta(e.target.value)} placeholder="—" />
            </div>
          </div>
        );
      case "estilo":
        return (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Estilo de invitación
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Elegí cómo se ve la invitación de tus invitados. Al guardar, se aplica a todas las
                invitaciones del evento.
              </p>
            </div>
            <InvitationThemePicker
              value={pendingThemeId}
              onChange={setPendingThemeId}
              disabled={saving}
            />
            {initial?.id ? null : (
              <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                Primero guardá la información básica del evento para poder cambiar el estilo.
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={sectionLabel}>Información básica</p>
              <StatusChip done={basicaStatus.done} />
            </div>
            <p className={`${summaryText} mt-1`}>{basicSummary[0]}</p>
            <p className="mt-1 text-xs text-slate-500">{basicSummary[1]}</p>
            <p className="mt-1 text-xs text-slate-500">{basicSummary[2]}</p>
            {!basicaStatus.done && basicaStatus.missing.length > 0 ? (
              <p className="mt-2 text-[11px] text-amber-200/90">
                Falta: {basicaStatus.missing.join(", ")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => openSection("basica")}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            {ctaLabel(basicaStatus)}
          </button>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={sectionLabel}>Ubicación</p>
              <StatusChip done={ubicacionStatus.done} />
            </div>
            <p className={`${summaryText} mt-1`}>{locationSummary[0]}</p>
            <p className="mt-1 text-xs text-slate-500">{locationSummary[1]}</p>
            {!ubicacionStatus.done && ubicacionStatus.missing.length > 0 ? (
              <p className="mt-2 text-[11px] text-amber-200/90">
                Falta: {ubicacionStatus.missing.join(", ")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => openSection("ubicacion")}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            {ctaLabel(ubicacionStatus)}
          </button>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={sectionLabel}>Mensaje</p>
              <StatusChip done={mensajeStatus.done} />
            </div>
            <p className={`${summaryText} mt-1 line-clamp-3`}>{messageSummary}</p>
          </div>
          <button
            type="button"
            onClick={() => openSection("mensaje")}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            {ctaLabel(mensajeStatus)}
          </button>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={sectionLabel}>Detalles opcionales</p>
              <StatusChip done={detallesStatus.done} />
            </div>
            <p className={`${summaryText} mt-1 text-xs`}>{detailsSummary.join(" · ")}</p>
          </div>
          <button
            type="button"
            onClick={() => openSection("detalles")}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            {ctaLabel(detallesStatus)}
          </button>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={sectionLabel}>Estilo de invitación</p>
              <StatusChip done={estiloStatus.done} />
            </div>
            <p className={`${summaryText} mt-1`}>{currentThemeMeta.name}</p>
            <p className="mt-1 text-xs text-slate-500">{currentThemeMeta.tagline}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              El estilo se aplica a todas las invitaciones del evento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openSection("estilo")}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            Cambiar
          </button>
        </div>
      </section>

      {err ? <p className="rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">{err}</p> : null}

      {editing ? (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-3 pb-[calc(env(safe-area-inset-bottom)+56px+16px)] backdrop-blur-sm sm:items-center sm:p-3 sm:pb-3">
          <div className="sheet-container relative z-[1000] flex max-h-[78vh] min-h-[40vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] animate-fadeIn sm:max-h-[80vh] sm:min-h-0">
            <div className="sheet-header px-4 pb-3 pt-3 sm:pt-4">
              <div className="mb-3 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-base font-semibold text-white">Editar</p>
              </div>
            </div>
            <div ref={editorRef} className="sheet-content min-h-0 flex-1 overflow-y-auto p-4">
              {renderEditor()}
            </div>
            <div className="sheet-footer sticky bottom-0 mt-auto border-t border-white/10 bg-[#0b1220] px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void persistChanges()}
                  disabled={saving || (editing === "estilo" && !initial?.id)}
                  className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
                >
                  {saving
                    ? "Guardando…"
                    : editing === "estilo"
                      ? "Aplicar estilo"
                      : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
