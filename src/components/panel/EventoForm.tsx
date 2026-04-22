"use client";

import type { CanalEnvioInvitacion, ConfiguracionInvitacionEvento, Evento } from "@/types/database";
import JurnexEditableCard from "@/components/ui/JurnexEditableCard";
import { InvitationThemePicker } from "@/components/panel/InvitationThemePicker";
import { SpotifyPlaylistConnect } from "@/components/panel/SpotifyPlaylistConnect";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import { panelBtnPrimary, panelBtnSecondary } from "@/components/panel/ds";
import {
  INVITACION_THEMES,
  type InvitacionThemeId,
  resolveInvitacionThemeId,
} from "@/lib/invitacion-theme";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useEventoCentroTab } from "@/components/panel/evento/EventoCentroTabContext";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const label = "block text-xs font-medium text-white/70";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-[#14B8A6] focus:ring-2";

const summaryText = "text-sm text-white/70";

function canalEnvioLabel(c: CanalEnvioInvitacion): string {
  switch (c) {
    case "correo":
      return "Correo electrónico";
    case "whatsapp":
      return "WhatsApp";
    default:
      return "Correo y WhatsApp";
  }
}

type SectionId = "basica" | "ubicacion" | "mensaje" | "detalles" | "estilo";

type ExpandedId = SectionId | "programa" | "apariencia" | "spotify" | "canal_envio" | "regalos";

export type EventoFormProps = {
  initial: Evento | null;
  spotify?: {
    eventoId: string;
    connected: boolean;
    playlistId: string | null;
    strictDb: boolean;
  } | null;
  programaHitosCount?: number;
  configuracionInvitacion?: ConfiguracionInvitacionEvento | null;
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

function parseOptionalNonNegInt(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

type SectionStatus = {
  done: boolean;
  missing: string[];
};

export function EventoForm({
  initial,
  spotify = null,
  programaHitosCount = 0,
  configuracionInvitacion = null,
}: EventoFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const centroTab = useEventoCentroTab();
  const showDatos = !centroTab || centroTab.tab === "datos";
  const showInvitacion = !centroTab || centroTab.tab === "invitacion";
  const showExperiencia = !centroTab || centroTab.tab === "experiencia";

  const [expanded, setExpanded] = useState<ExpandedId | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
  const [objetivo_invitaciones_enviar, setObjetivoInvitaciones] = useState(
    () => (initial?.objetivo_invitaciones_enviar != null ? String(initial.objetivo_invitaciones_enviar) : "")
  );
  const [objetivo_personas_total, setObjetivoPersonas] = useState(
    () => (initial?.objetivo_personas_total != null ? String(initial.objetivo_personas_total) : "")
  );
  const [motivo_viaje, setMotivo] = useState(initial?.motivo_viaje ?? "");
  const initialThemeId = resolveInvitacionThemeId({ evento: initial, invitado: null }, null);
  const [theme_id, setThemeId] = useState<InvitacionThemeId>(initialThemeId);
  const [pendingThemeId, setPendingThemeId] = useState<InvitacionThemeId>(initialThemeId);

  const [canalEnvio, setCanalEnvio] = useState<CanalEnvioInvitacion>(
    () => configuracionInvitacion?.canal_envio ?? "ambos"
  );
  const [regalosActivos, setRegalosActivos] = useState(
    () => configuracionInvitacion?.regalos_activos ?? false
  );
  const [urlRegalos, setUrlRegalos] = useState(() => configuracionInvitacion?.url_regalos ?? "");

  useEffect(() => {
    if (!configuracionInvitacion) return;
    setCanalEnvio(configuracionInvitacion.canal_envio);
    setRegalosActivos(configuracionInvitacion.regalos_activos);
    setUrlRegalos(configuracionInvitacion.url_regalos ?? "");
  }, [configuracionInvitacion?.id, configuracionInvitacion?.updated_at]);

  useEffect(() => {
    if (!initial?.id) return;
    setObjetivoInvitaciones(
      initial.objetivo_invitaciones_enviar != null ? String(initial.objetivo_invitaciones_enviar) : ""
    );
    setObjetivoPersonas(initial.objetivo_personas_total != null ? String(initial.objetivo_personas_total) : "");
  }, [initial?.id, initial?.objetivo_invitaciones_enviar, initial?.objetivo_personas_total]);

  async function upsertConfiguracionRow(
    patch: Partial<{
      estilo: string | null;
      canal_envio: CanalEnvioInvitacion;
      regalos_activos: boolean;
      url_regalos: string | null;
    }>
  ) {
    if (!initial?.id) {
      return { error: { message: "Falta el evento." } as { message: string } };
    }
    const estilo =
      patch.estilo !== undefined
        ? patch.estilo
        : (configuracionInvitacion?.estilo ?? initial.theme_id ?? null);
    const canal = patch.canal_envio ?? canalEnvio;
    const regAct = patch.regalos_activos ?? regalosActivos;
    const urlRaw = patch.url_regalos !== undefined ? patch.url_regalos : urlRegalos;
    const urlNorm = (urlRaw ?? "").trim() || null;
    return supabase.from("configuracion_invitacion_evento").upsert(
      {
        evento_id: initial.id,
        estilo,
        canal_envio: canal,
        regalos_activos: regAct,
        url_regalos: urlNorm,
      },
      { onConflict: "evento_id" }
    );
  }

  function cardOpen(id: ExpandedId): boolean {
    return expanded === id;
  }

  function cardSetOpen(id: ExpandedId, open: boolean) {
    if (open) {
      setExpanded(id);
    } else {
      setExpanded((prev) => (prev === id ? null : prev));
    }
  }

  async function persistThemeChange() {
    if (!initial?.id) {
      setErr("Primero completa la información básica del evento.");
      return;
    }
    const next = pendingThemeId;
    if (next === theme_id) {
      setExpanded(null);
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await supabase.rpc("apply_evento_theme", {
      p_evento_id: initial.id,
      p_theme_id: next,
    });
    if (error) {
      setSaving(false);
      setErr(error.message);
      return;
    }
    const { error: cfgErr } = await upsertConfiguracionRow({ estilo: next });
    setSaving(false);
    if (cfgErr) {
      setErr(cfgErr.message);
      return;
    }
    setThemeId(next);
    router.refresh();
    setExpanded(null);
    trackEvent("evento_section_saved", { section: "estilo" });
    trackEvent("invitation_theme_changed", {
      theme_id: next,
      source: "panel_evento",
    });
    toast.success("Estilo aplicado a todas las invitaciones ✨");
  }

  async function persistSection(section: SectionId) {
    if (section === "estilo") {
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
      objetivo_invitaciones_enviar: parseOptionalNonNegInt(objetivo_invitaciones_enviar),
      objetivo_personas_total: parseOptionalNonNegInt(objetivo_personas_total),
    };

    if (initial?.id) {
      const { error } = await supabase.from("eventos").update(row).eq("id", initial.id);
      setSaving(false);
      if (error) {
        setErr(error.message);
        return;
      }
      router.refresh();
      setExpanded(null);
      trackEvent("evento_section_saved", { section });
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
    setExpanded(null);
    trackEvent("evento_section_saved", { section });
    toast.success("Cambios guardados ✨");
  }

  async function persistCanalEnvio() {
    if (!initial?.id) {
      setErr("Primero completa la información básica del evento.");
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await upsertConfiguracionRow({ canal_envio: canalEnvio });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
    setExpanded(null);
    trackEvent("evento_section_saved", { section: "invitacion_canal" });
    toast.success("Canal de envío guardado");
  }

  async function persistRegalosInvitacion() {
    if (!initial?.id) {
      setErr("Primero completa la información básica del evento.");
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await upsertConfiguracionRow({
      regalos_activos: regalosActivos,
      url_regalos: urlRegalos.trim() || null,
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
    setExpanded(null);
    trackEvent("evento_section_saved", { section: "invitacion_regalos" });
    toast.success("Preferencias de regalos guardadas");
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
  const metaInvN = parseOptionalNonNegInt(objetivo_invitaciones_enviar);
  const metaPerN = parseOptionalNonNegInt(objetivo_personas_total);
  const detailsSummary = [
    `Código: ${codigo_vuelo || "—"}`,
    `Asiento: ${asiento_default || "—"}`,
    `Puerta: ${puerta || "—"}`,
    metaInvN != null || metaPerN != null
      ? `Meta: ${metaInvN != null ? `${metaInvN} inv.` : "—"} · ${metaPerN != null ? `${metaPerN} pers.` : "—"}`
      : null,
  ].filter(Boolean) as string[];

  const footerActions = (section: SectionId) => (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
      <button type="button" onClick={() => setExpanded(null)} className={panelBtnSecondary}>
        Cancelar
      </button>
      <button
        type="button"
        onClick={() => void persistSection(section)}
        disabled={saving || (section === "estilo" && !initial?.id)}
        className={panelBtnPrimary}
      >
        {saving
          ? "Guardando…"
          : section === "estilo"
            ? "Aplicar estilo"
            : "Guardar cambios"}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {showDatos ? (
        <>
          <JurnexEditableCard
            title="Información básica"
            status={basicaStatus.done ? "Listo" : "Pendiente"}
            open={cardOpen("basica")}
            onOpenChange={(o) => cardSetOpen("basica", o)}
            preview={
              <div className="space-y-1 text-xs text-white/70">
                <p className={summaryText}>{basicSummary[0]}</p>
                <p className="text-white/50">{basicSummary[1]}</p>
                <p className="text-white/50">{basicSummary[2]}</p>
                {!basicaStatus.done && basicaStatus.missing.length > 0 ? (
                  <p className="text-[11px] text-amber-200/90">Falta: {basicaStatus.missing.join(", ")}</p>
                ) : null}
              </div>
            }
          >
            <div className="space-y-6">
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Personas</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Evento</p>
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
            {footerActions("basica")}
          </JurnexEditableCard>

          <JurnexEditableCard
            title="Ubicación"
            status={ubicacionStatus.done ? "Listo" : "Pendiente"}
            open={cardOpen("ubicacion")}
            onOpenChange={(o) => cardSetOpen("ubicacion", o)}
            preview={
              <div className="space-y-1 text-xs text-white/70">
                <p className={summaryText}>{locationSummary[0]}</p>
                <p className="text-white/50">{locationSummary[1]}</p>
                {!ubicacionStatus.done && ubicacionStatus.missing.length > 0 ? (
                  <p className="text-[11px] text-amber-200/90">Falta: {ubicacionStatus.missing.join(", ")}</p>
                ) : null}
              </div>
            }
          >
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
            {footerActions("ubicacion")}
          </JurnexEditableCard>

          <JurnexEditableCard
            title="Mensaje"
            status={mensajeStatus.done ? "Listo" : "Pendiente"}
            open={cardOpen("mensaje")}
            onOpenChange={(o) => cardSetOpen("mensaje", o)}
            preview={<p className={`${summaryText} line-clamp-5 text-xs`}>{messageSummary}</p>}
          >
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
            {footerActions("mensaje")}
          </JurnexEditableCard>

          <JurnexEditableCard
            title="Detalles opcionales"
            status={detallesStatus.done ? "Listo" : "Opcional"}
            open={cardOpen("detalles")}
            onOpenChange={(o) => cardSetOpen("detalles", o)}
            preview={<p className="text-xs text-white/70">{detailsSummary.join(" · ")}</p>}
          >
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
              <div className="sm:col-span-2 border-t border-white/10 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Metas de lista (opcional)</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
                  Si definís números objetivo, la misión «Meta» del panel se completa al alcanzarlos con tu lista actual
                  (invitaciones = filas; personas incluyen acompañantes).
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label}>Invitaciones a enviar</label>
                    <input
                      className={input}
                      inputMode="numeric"
                      value={objetivo_invitaciones_enviar}
                      onChange={(e) => setObjetivoInvitaciones(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ej. 80"
                    />
                  </div>
                  <div>
                    <label className={label}>Personas en total</label>
                    <input
                      className={input}
                      inputMode="numeric"
                      value={objetivo_personas_total}
                      onChange={(e) => setObjetivoPersonas(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ej. 120"
                    />
                  </div>
                </div>
              </div>
            </div>
            {footerActions("detalles")}
          </JurnexEditableCard>
        </>
      ) : null}

      {showInvitacion ? (
        <>
          <JurnexEditableCard
            title="Estilo de invitación"
            status={estiloStatus.done ? "Listo" : null}
            open={cardOpen("estilo")}
            onOpenChange={(o) => {
              cardSetOpen("estilo", o);
              if (o) setPendingThemeId(theme_id);
            }}
            preview={
              <div className="space-y-1 text-xs text-white/70">
                <p className="font-medium text-white">{currentThemeMeta.name}</p>
                <p className="text-white/50">{currentThemeMeta.tagline}</p>
                <p className="text-[11px] text-white/45">El estilo se aplica a todas las invitaciones del evento.</p>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Estilo de invitación</p>
                <p className="mt-1 text-xs text-white/60">
                  Elige cómo se ve la invitación. Al guardar, se aplica a todas las invitaciones del evento.
                </p>
              </div>
              <InvitationThemePicker value={pendingThemeId} onChange={setPendingThemeId} disabled={saving} />
              {initial?.id ? null : (
                <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                  Primero guarda la información básica del evento para poder cambiar el estilo.
                </p>
              )}
            </div>
            {footerActions("estilo")}
          </JurnexEditableCard>

          <JurnexEditableCard
            title="Canal de envío"
            status="Listo"
            open={cardOpen("canal_envio")}
            onOpenChange={(o) => cardSetOpen("canal_envio", o)}
            preview={
              <div className="space-y-1">
                <p className="text-sm text-white/80">{canalEnvioLabel(canalEnvio)}</p>
                <p className="text-[11px] text-white/45">
                  Preferencia para envíos e insistencias (correo y/o WhatsApp).
                </p>
              </div>
            }
          >
            <div className="space-y-3">
              <p className="text-xs text-white/60">
                Definí cómo querés contactar a tus invitados cuando habilitemos envíos desde la plataforma.
              </p>
              <fieldset className="space-y-2">
                <legend className="sr-only">Canal de envío</legend>
                {(
                  [
                    ["correo", "Solo correo electrónico"],
                    ["whatsapp", "Solo WhatsApp"],
                    ["ambos", "Correo y WhatsApp"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85"
                  >
                    <input
                      type="radio"
                      name="canal_envio"
                      className="mt-0.5"
                      checked={canalEnvio === value}
                      onChange={() => setCanalEnvio(value)}
                      disabled={saving}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              <button type="button" onClick={() => setExpanded(null)} className={panelBtnSecondary} disabled={saving}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void persistCanalEnvio()}
                disabled={saving || !initial?.id}
                className={panelBtnPrimary}
              >
                Guardar
              </button>
            </div>
          </JurnexEditableCard>

          <JurnexEditableCard
            title="Regalos en la invitación"
            status={regalosActivos ? "Activo" : "Opcional"}
            open={cardOpen("regalos")}
            onOpenChange={(o) => cardSetOpen("regalos", o)}
            preview={
              <p className="text-sm text-white/80">
                {regalosActivos
                  ? urlRegalos.trim()
                    ? "Enlace visible para invitados"
                    : "Activado sin URL externa"
                  : "No se muestra bloque de regalos"}
              </p>
            }
          >
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/85">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-black/30"
                  checked={regalosActivos}
                  onChange={(e) => setRegalosActivos(e.target.checked)}
                  disabled={saving}
                />
                Mostrar información de regalos en la invitación
              </label>
              <div>
                <label className={label}>URL de lista de regalos o página (opcional)</label>
                <input
                  className={input}
                  value={urlRegalos}
                  onChange={(e) => setUrlRegalos(e.target.value)}
                  placeholder="https://…"
                  disabled={saving || !regalosActivos}
                />
              </div>
              <p className="text-[11px] text-white/45">
                Los cobros y el detalle siguen en{" "}
                <Link href="/panel/finanzas" className="text-teal-400/90 hover:text-teal-300">
                  Finanzas
                </Link>
                .
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              <button type="button" onClick={() => setExpanded(null)} className={panelBtnSecondary} disabled={saving}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void persistRegalosInvitacion()}
                disabled={saving || !initial?.id}
                className={panelBtnPrimary}
              >
                Guardar
              </button>
            </div>
          </JurnexEditableCard>
        </>
      ) : null}

      {showExperiencia ? (
        <>
          <JurnexEditableCard
            title="Programa"
            status={programaHitosCount > 0 ? "Listo" : "Pendiente"}
            open={cardOpen("programa")}
            onOpenChange={(o) => cardSetOpen("programa", o)}
            preview={
              <p className="text-sm text-white/80">
                {programaHitosCount === 1 ? "1 hito definido" : `${programaHitosCount} hitos definidos`}
              </p>
            }
          >
            <div className="space-y-3">
              <p className="text-xs text-white/60">
                Editá horarios y momentos en la vista dedicada del programa del día.
              </p>
              <Link
                href="/panel/viaje/programa"
                className={`${panelBtnSecondary} inline-flex w-full justify-center sm:w-auto`}
              >
                Abrir programa
              </Link>
            </div>
          </JurnexEditableCard>

          <JurnexEditableCard
            title="Apariencia del panel"
            status={null}
            open={cardOpen("apariencia")}
            onOpenChange={(o) => cardSetOpen("apariencia", o)}
            preview={
              <p className="text-xs text-white/70">Tema visual del panel (solo en este navegador).</p>
            }
          >
            <div className="space-y-3">
              <p className="text-xs text-white/70">Elige el tema visual del panel; se guarda solo en este navegador.</p>
              <div className="max-w-xl">
                <PanelThemeSelector />
              </div>
            </div>
          </JurnexEditableCard>

          {spotify ? (
            <JurnexEditableCard
              title="Música colaborativa (Spotify)"
              status={spotify.connected ? "Listo" : "Pendiente"}
              open={cardOpen("spotify")}
              onOpenChange={(o) => cardSetOpen("spotify", o)}
              preview={
                <p className="text-xs text-white/70">
                  {spotify.connected ? "Playlist vinculada al panel." : "Conectá Spotify para la playlist colaborativa."}
                </p>
              }
            >
              {!spotify.strictDb ? (
                <p className="text-xs text-amber-200/90">
                  La música colaborativa requiere configuración del servidor (service role). Si ves esto en producción,
                  contacta soporte.
                </p>
              ) : (
                <Suspense
                  fallback={
                    <div className="h-32 animate-pulse rounded-lg border border-[#14B8A6]/15 bg-black/20" aria-hidden />
                  }
                >
                  <SpotifyPlaylistConnect
                    eventoId={spotify.eventoId}
                    spotifyConnected={spotify.connected}
                    initialPlaylistId={spotify.playlistId}
                  />
                </Suspense>
              )}
            </JurnexEditableCard>
          ) : null}
        </>
      ) : null}

      {err ? <p className="rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">{err}</p> : null}
    </div>
  );
}
