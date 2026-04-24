"use client";

import type {
  CanalEnvioInvitacion,
  ConfiguracionInvitacionEvento,
  Evento,
  EventoProgramaHito,
} from "@/types/database";
import { ProgramaHitosManager } from "@/components/dashboard/ProgramaHitosManager";
import JurnexEditableCard from "@/components/ui/JurnexEditableCard";
import { InvitationThemePicker } from "@/components/panel/InvitationThemePicker";
import { SpotifyPlaylistConnect } from "@/components/panel/SpotifyPlaylistConnect";
import { EventoDatosBoardingPassPreview } from "@/components/panel/EventoDatosBoardingPassPreview";
import { EventoTripulacionCabinaSection, type MiembroEquipoRow } from "@/components/panel/EventoTripulacionCabinaSection";
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
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const label = "block text-xs font-medium text-white/70";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-jurnex-primary focus:ring-2";

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

type SectionId = "tripulacion" | "boarding" | "mensaje" | "estilo";

type ExpandedId = SectionId | "programa" | "spotify" | "canal_envio" | "regalos" | "cabina";

export type EventoFormProps = {
  initial: Evento | null;
  spotify?: {
    eventoId: string;
    connected: boolean;
    playlistId: string | null;
    strictDb: boolean;
  } | null;
  programaHitosCount?: number;
  /** Hitos del día (mismo origen que `/panel/viaje/programa`) para editar en la card Experiencia. */
  programaHitos?: EventoProgramaHito[];
  programaHitosError?: string | null;
  programaHitosTableMissing?: boolean;
  configuracionInvitacion?: ConfiguracionInvitacionEvento | null;
  /** Mismo listado que Ajustes (`evento_equipo_list`) para la card Tripulación de cabina. */
  equipoMiembros?: MiembroEquipoRow[] | null;
  isEventoAdmin?: boolean;
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
  programaHitos = [],
  programaHitosError = null,
  programaHitosTableMissing = false,
  configuracionInvitacion = null,
  equipoMiembros = null,
  isEventoAdmin = false,
}: EventoFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const centroTab = useEventoCentroTab();
  const showTripulacion = !centroTab || centroTab.tab === "tripulacion";
  const showInvitacion = !centroTab || centroTab.tab === "invitacion";
  const showExperiencia = !centroTab || centroTab.tab === "experiencia";

  const [expanded, setExpanded] = useState<ExpandedId | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [boardingCarouselSlide, setBoardingCarouselSlide] = useState(0);
  const boardingPreviewPanelRef = useRef<HTMLDivElement | null>(null);
  const boardingFormPanelRef = useRef<HTMLDivElement | null>(null);

  const onBoardingCarouselScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const t = e.currentTarget;
    const w = t.clientWidth;
    if (w < 1) return;
    setBoardingCarouselSlide(t.scrollLeft < w * 0.52 ? 0 : 1);
  }, []);

  const goBoardingPreview = useCallback(() => {
    boardingPreviewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, []);

  const goBoardingForm = useCallback(() => {
    boardingFormPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, []);

  const [nombre_novio_1, setN1] = useState(initial?.nombre_novio_1 ?? "");
  const [nombre_novio_2, setN2] = useState(initial?.nombre_novio_2 ?? "");
  const [fecha_principal, setFechaPrincipal] = useState(
    fechaInput(initial?.fecha_evento) || fechaInput(initial?.fecha_boda)
  );
  const [nombre_evento, setNombreEvento] = useState(initial?.nombre_evento ?? "Boda Dreams");
  const [lugar_evento_linea, setLugarLinea] = useState(initial?.lugar_evento_linea ?? "");
  const [codigo_vuelo, setCodigo] = useState(initial?.codigo_vuelo ?? "");
  const [hora_embarque, setHora] = useState(initial?.hora_embarque ?? "12:00");
  const [asiento_default, setAsiento] = useState(initial?.asiento_default ?? "");
  const [objetivo_invitaciones_enviar, setObjetivoInvitaciones] = useState(
    () => (initial?.objetivo_invitaciones_enviar != null ? String(initial.objetivo_invitaciones_enviar) : "")
  );
  const [objetivo_personas_total, setObjetivoPersonas] = useState(
    () => (initial?.objetivo_personas_total != null ? String(initial.objetivo_personas_total) : "")
  );
  const [motivo_viaje, setMotivo] = useState(initial?.motivo_viaje ?? "");
  const [boarding_linea_aerea, setBoardingLinea] = useState(
    () => initial?.boarding_linea_aerea?.trim() || "DREAMS AIRLINES"
  );
  const [boarding_tagline, setBoardingTagline] = useState(
    () => initial?.boarding_tagline?.trim() || "together, forever"
  );
  const [boarding_logo_url, setBoardingLogo] = useState(() => initial?.boarding_logo_url ?? "");
  const [boarding_emblema_url, setBoardingEmblema] = useState(() => initial?.boarding_emblema_url ?? "");
  const [boarding_origen_iata, setOrigenIata] = useState(() => initial?.boarding_origen_iata ?? "");
  const [boarding_destino_iata, setDestinoIata] = useState(() => initial?.boarding_destino_iata ?? "");
  const [dress_code, setDressCode] = useState(() => initial?.dress_code?.trim() || "Elegante");
  const [direccion_evento_completa, setDireccionCompleta] = useState(
    () => initial?.direccion_evento_completa ?? ""
  );
  const [grupo_embarque_default, setGrupoDefault] = useState(() => initial?.grupo_embarque_default ?? "");
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

  useEffect(() => {
    if (!initial?.id) return;
    setBoardingLinea(initial.boarding_linea_aerea?.trim() || "DREAMS AIRLINES");
    setBoardingTagline(initial.boarding_tagline?.trim() || "together, forever");
    setBoardingLogo(initial.boarding_logo_url ?? "");
    setBoardingEmblema(initial.boarding_emblema_url ?? "");
    setOrigenIata(initial.boarding_origen_iata ?? "");
    setDestinoIata(initial.boarding_destino_iata ?? "");
    setDressCode(initial.dress_code?.trim() || "Elegante");
    setDireccionCompleta(initial.direccion_evento_completa ?? "");
    setGrupoDefault(initial.grupo_embarque_default ?? "");
  }, [
    initial?.id,
    initial?.boarding_linea_aerea,
    initial?.boarding_tagline,
    initial?.boarding_logo_url,
    initial?.boarding_emblema_url,
    initial?.boarding_origen_iata,
    initial?.boarding_destino_iata,
    initial?.dress_code,
    initial?.direccion_evento_completa,
    initial?.grupo_embarque_default,
  ]);

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
      lugar_evento_linea: lugar_evento_linea.trim() || null,
      codigo_vuelo: codigo_vuelo.trim() || null,
      hora_embarque: hora_embarque.trim() || null,
      puerta: null,
      asiento_default: asiento_default.trim() || null,
      motivo_viaje: motivo_viaje.trim() || null,
      objetivo_invitaciones_enviar: parseOptionalNonNegInt(objetivo_invitaciones_enviar),
      objetivo_personas_total: parseOptionalNonNegInt(objetivo_personas_total),
      boarding_linea_aerea: boarding_linea_aerea.trim() || null,
      boarding_tagline: boarding_tagline.trim() || null,
      boarding_logo_url: boarding_logo_url.trim() || null,
      boarding_emblema_url: boarding_emblema_url.trim() || null,
      boarding_origen_iata: boarding_origen_iata.trim() || null,
      boarding_destino_iata: boarding_destino_iata.trim() || null,
      dress_code: dress_code.trim() || null,
      direccion_evento_completa: direccion_evento_completa.trim() || null,
      grupo_embarque_default: grupo_embarque_default.trim() || null,
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

  const tripulacionStatus: SectionStatus = (() => {
    const missing: string[] = [];
    if (!nombre_novio_1.trim()) missing.push("nombre 1");
    if (!nombre_novio_2.trim()) missing.push("nombre 2");
    if (!nombre_evento.trim()) missing.push("nombre del evento");
    return { done: missing.length === 0, missing };
  })();

  const boardingStatus: SectionStatus = (() => {
    const missing: string[] = [];
    if (!fecha_principal.trim()) missing.push("fecha del evento");
    if (!hora_embarque.trim()) missing.push("hora de embarque");
    return { done: missing.length === 0, missing };
  })();

  const mensajeStatus: SectionStatus = {
    done: motivo_viaje.trim().length > 0,
    missing: motivo_viaje.trim().length > 0 ? [] : ["mensaje"],
  };

  const estiloStatus: SectionStatus = { done: true, missing: [] };
  const currentThemeMeta =
    INVITACION_THEMES.find((t) => t.id === theme_id) ?? INVITACION_THEMES[0];

  const previewEventoForBoarding: Evento = useMemo(
    () => ({
      id: initial?.id ?? "00000000-0000-0000-0000-00000000e000",
      nombre_novio_1: nombre_novio_1 || null,
      nombre_novio_2: nombre_novio_2 || null,
      fecha_boda: fecha_principal || null,
      fecha_evento: fecha_principal || null,
      nombre_evento: nombre_evento || null,
      destino: null,
      puerta: null,
      lugar_evento_linea: lugar_evento_linea || null,
      codigo_vuelo: codigo_vuelo || null,
      hora_embarque: hora_embarque || null,
      asiento_default: asiento_default || null,
      motivo_viaje: motivo_viaje || null,
      theme_id: theme_id,
      boarding_linea_aerea: boarding_linea_aerea || null,
      boarding_tagline: boarding_tagline || null,
      boarding_logo_url: boarding_logo_url || null,
      boarding_emblema_url: boarding_emblema_url || null,
      boarding_origen_iata: boarding_origen_iata || null,
      boarding_destino_iata: boarding_destino_iata || null,
      dress_code: dress_code || null,
      direccion_evento_completa: direccion_evento_completa || null,
      grupo_embarque_default: grupo_embarque_default || null,
    }),
    [
      initial?.id,
      nombre_novio_1,
      nombre_novio_2,
      fecha_principal,
      nombre_evento,
      lugar_evento_linea,
      codigo_vuelo,
      hora_embarque,
      asiento_default,
      motivo_viaje,
      theme_id,
      boarding_linea_aerea,
      boarding_tagline,
      boarding_logo_url,
      boarding_emblema_url,
      boarding_origen_iata,
      boarding_destino_iata,
      dress_code,
      direccion_evento_completa,
      grupo_embarque_default,
    ]
  );

  const tripulacionSummary = [
    [nombre_novio_1, nombre_novio_2].filter(Boolean).join(" & ") || "Nombres pendientes",
    nombre_evento || "Nombre del evento pendiente",
  ];
  const cabinaEquipo = equipoMiembros ?? [];
  const cabinaPreviewText =
    cabinaEquipo.length > 0
      ? `${cabinaEquipo.length} ${cabinaEquipo.length === 1 ? "cuenta" : "cuentas"} con acceso`
      : "Solo tu acceso o sin datos cargados";
  const programaCount = initial?.id ? programaHitos.length : programaHitosCount;
  const boardingSummary = [
    `${formatDate(fecha_principal)}${hora_embarque ? ` · embarque ${hora_embarque}` : ""}`,
    [direccion_evento_completa, lugar_evento_linea].filter(Boolean).join(" · ") || "Dirección / lugar pendiente",
  ];
  const messageSummary = motivo_viaje?.trim()
    ? motivo_viaje.trim()
    : "Todavía no agregaste mensaje para tus invitados.";
  const metaInvN = parseOptionalNonNegInt(objetivo_invitaciones_enviar);
  const metaPerN = parseOptionalNonNegInt(objetivo_personas_total);
  const detailsSummary = [
    metaInvN != null || metaPerN != null
      ? `Metas: ${metaInvN != null ? `${metaInvN} inv.` : "—"} · ${metaPerN != null ? `${metaPerN} pers.` : "—"}`
      : "Metas de lista (opcional)",
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
      {showTripulacion ? (
        <div className="min-w-0 space-y-4">
          <JurnexEditableCard
            title="Tripulación de mando"
            status={tripulacionStatus.done ? "Listo" : "Pendiente"}
            open={cardOpen("tripulacion")}
            onOpenChange={(o) => cardSetOpen("tripulacion", o)}
            preview={
              <div className="space-y-1 text-xs text-white/70">
                <p className={summaryText}>{tripulacionSummary[0]}</p>
                <p className="text-white/50">{tripulacionSummary[1]}</p>
                <p className="line-clamp-2 text-white/40">{detailsSummary.join(" · ")}</p>
                {!tripulacionStatus.done && tripulacionStatus.missing.length > 0 ? (
                  <p className="text-[11px] text-amber-200/90">Falta: {tripulacionStatus.missing.join(", ")}</p>
                ) : null}
              </div>
            }
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Nombre 1</label>
                  <input className={input} value={nombre_novio_1} onChange={(e) => setN1(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Nombre 2</label>
                  <input className={input} value={nombre_novio_2} onChange={(e) => setN2(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Nombre del evento</label>
                  <p className="mb-1 text-[10px] leading-relaxed text-white/45">
                    Uso en panel, Spotify o checkout. No se muestra en el boarding pass.
                  </p>
                  <input className={input} value={nombre_evento} onChange={(e) => setNombreEvento(e.target.value)} />
                </div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Metas de lista (opcional)</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
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
            {footerActions("tripulacion")}
          </JurnexEditableCard>

          {initial?.id ? (
            <JurnexEditableCard
              title="Tripulación de cabina"
              status="Listo"
              open={cardOpen("cabina")}
              onOpenChange={(o) => cardSetOpen("cabina", o)}
              preview={
                <div className="space-y-1 text-xs text-white/70">
                  <p className={summaryText}>Organizadores (mismos que en Ajustes)</p>
                  <p className="line-clamp-2 text-white/50">{cabinaPreviewText}</p>
                </div>
              }
            >
              <EventoTripulacionCabinaSection
                eventoId={initial.id}
                initialMiembros={cabinaEquipo}
                isAdmin={isEventoAdmin}
              />
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                <button type="button" onClick={() => cardSetOpen("cabina", false)} className={panelBtnSecondary}>
                  Cerrar
                </button>
              </div>
            </JurnexEditableCard>
          ) : null}

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
        </div>
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
            title="Boarding pass"
            status={boardingStatus.done ? "Listo" : "Pendiente"}
            open={cardOpen("boarding")}
            onOpenChange={(o) => cardSetOpen("boarding", o)}
            preview={
              <div className="space-y-1 text-xs text-white/70">
                <p className="text-white/50">{boardingSummary[0]}</p>
                <p className="line-clamp-2 text-white/40">{boardingSummary[1]}</p>
                {!boardingStatus.done && boardingStatus.missing.length > 0 ? (
                  <p className="text-[11px] text-amber-200/90">Falta: {boardingStatus.missing.join(", ")}</p>
                ) : null}
              </div>
            }
          >
            <p className="mb-2 text-xs leading-relaxed text-white/50">
              Contenido y apariencia del pase: combina con el <span className="text-white/70">estilo de invitación</span> (tema
              arriba). El preview usa el tema elegido.
            </p>
            <p className="mb-2 text-center text-[11px] text-white/45 lg:hidden">Deslizá horizontalmente o usá las pestañas de abajo.</p>
            <div
              onScroll={onBoardingCarouselScroll}
              className="w-full min-w-0 gap-6 max-lg:flex max-lg:items-start max-lg:snap-x max-lg:snap-mandatory max-lg:overflow-x-auto max-lg:overflow-y-visible max-lg:scroll-smooth max-lg:overscroll-x-contain max-lg:pb-1 max-lg:[-ms-overflow-style:none] max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-[minmax(0,1fr)_min(28rem,100%)] lg:items-start lg:overflow-visible"
            >
              <div
                ref={boardingFormPanelRef}
                className="order-2 min-w-0 max-lg:min-w-full max-lg:shrink-0 max-lg:snap-start space-y-6 lg:order-1"
              >
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Cabecera del boarding pass</p>
                  <p className="mb-2 text-[10px] leading-relaxed text-white/45">Logo: URL pública o ruta bajo /public. Emblema: icono pequeño opcional.</p>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={label}>Nombre de la línea aérea (marca)</label>
                      <input className={input} value={boarding_linea_aerea} onChange={(e) => setBoardingLinea(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Lema / tagline bajo el nombre</label>
                      <input
                        className={input}
                        value={boarding_tagline}
                        onChange={(e) => setBoardingTagline(e.target.value)}
                        placeholder="together, forever"
                      />
                    </div>
                    <div>
                      <label className={label}>URL del logo</label>
                      <input
                        className={input}
                        value={boarding_logo_url}
                        onChange={(e) => setBoardingLogo(e.target.value)}
                        placeholder="/dreams-airlines-logo.png o https://…"
                      />
                    </div>
                    <div>
                      <label className={label}>URL del emblema (opcional)</label>
                      <input
                        className={input}
                        value={boarding_emblema_url}
                        onChange={(e) => setBoardingEmblema(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                </section>
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Origen y destino (cabecera)</p>
                  <p className="mb-2 text-[10px] text-white/45">Texto libre: origen a la izquierda del avión, destino a la derecha.</p>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label}>Origen</label>
                      <input
                        className={input}
                        value={boarding_origen_iata}
                        onChange={(e) => setOrigenIata(e.target.value)}
                        placeholder="Ej. Santiago"
                      />
                    </div>
                    <div>
                      <label className={label}>Destino</label>
                      <input
                        className={input}
                        value={boarding_destino_iata}
                        onChange={(e) => setDestinoIata(e.target.value)}
                        placeholder="Ej. El gran día"
                      />
                    </div>
                  </div>
                </section>
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Lugar y dirección</p>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={label}>Nombre del centro o venue</label>
                      <input
                        className={input}
                        value={lugar_evento_linea}
                        onChange={(e) => setLugarLinea(e.target.value)}
                        placeholder="Ej. Viña, salón, nombre comercial"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={label}>Dirección completa (mapa e itinerario)</label>
                      <input
                        className={input}
                        value={direccion_evento_completa}
                        onChange={(e) => setDireccionCompleta(e.target.value)}
                        placeholder="Calle, número, comuna, región (para mapa e itinerario)"
                      />
                      <p className="mt-1 text-[10px] text-white/40">Única dirección usada en &quot;Cómo llegar&quot; y QR</p>
                    </div>
                  </div>
                </section>
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Dress code</p>
                  <div className="mt-2">
                    <input className={input} value={dress_code} onChange={(e) => setDressCode(e.target.value)} placeholder="Elegante" />
                  </div>
                </section>
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Detalle de embarque en el pase</p>
                  <p className="mb-2 text-[10px] leading-relaxed text-white/45">Fecha y hora que se muestran en el grid del boarding pass (código, hora, fecha).</p>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={label}>Fecha del evento</label>
                      <input
                        className={input}
                        type="date"
                        value={fecha_principal}
                        onChange={(e) => setFechaPrincipal(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={label}>Hora de embarque</label>
                      <input
                        className={input}
                        value={hora_embarque}
                        onChange={(e) => setHora(e.target.value)}
                        placeholder="HH:MM"
                      />
                      <p className="mt-1 text-[10px] text-white/40">Celda «Hora» con fondo dorado en el pase</p>
                    </div>
                    <div>
                      <label className={label}>Código de vuelo</label>
                      <input
                        className={input}
                        value={codigo_vuelo}
                        onChange={(e) => setCodigo(e.target.value)}
                        placeholder="DM7726"
                      />
                    </div>
                    <div>
                      <label className={label}>Grupo (p. ej. Familia)</label>
                      <input
                        className={input}
                        value={grupo_embarque_default}
                        onChange={(e) => setGrupoDefault(e.target.value)}
                        placeholder="Opcional, por defecto según asiento"
                      />
                    </div>
                    <div>
                      <label className={label}>Asiento por defecto (celda «Destino» del pase)</label>
                      <input
                        className={input}
                        value={asiento_default}
                        onChange={(e) => setAsiento(e.target.value)}
                        placeholder="12A o varias líneas; se ve en el detalle de embarque"
                      />
                      <p className="mt-1 text-[10px] text-white/40">En el grid del boarding, columna Destino. Si el invitado tiene asiento propio, manda sobre este valor.</p>
                    </div>
                  </div>
                </section>
              </div>
              <aside
                ref={boardingPreviewPanelRef}
                className="order-1 w-full min-w-0 max-w-full max-lg:min-w-full max-lg:shrink-0 max-lg:snap-start lg:order-2 lg:max-w-[28rem] lg:justify-self-end lg:sticky lg:top-0 lg:max-h-[min(100vh,52rem)] lg:overflow-y-auto lg:overflow-x-visible"
                aria-label="Muestra del boarding pass"
              >
                <EventoDatosBoardingPassPreview previewEvento={previewEventoForBoarding} themeId={theme_id} />
              </aside>
            </div>
            <div
              className="mt-2 flex justify-center gap-1.5 lg:hidden"
              role="tablist"
              aria-label="Vista previa o formulario del boarding pass"
            >
              <button
                type="button"
                role="tab"
                aria-selected={boardingCarouselSlide === 0}
                onClick={goBoardingPreview}
                className={
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition " +
                  (boardingCarouselSlide === 0
                    ? "border-teal-400/50 bg-teal-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/55")
                }
              >
                Vista previa
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={boardingCarouselSlide === 1}
                onClick={goBoardingForm}
                className={
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition " +
                  (boardingCarouselSlide === 1
                    ? "border-teal-400/50 bg-teal-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/55")
                }
              >
                Editar pase
              </button>
            </div>
            {footerActions("boarding")}
          </JurnexEditableCard>
        </>
      ) : null}

      {showExperiencia ? (
        <>
          <JurnexEditableCard
            title="Programa"
            status={programaCount > 0 ? "Listo" : "Pendiente"}
            open={cardOpen("programa")}
            onOpenChange={(o) => cardSetOpen("programa", o)}
            preview={
              <p className="text-sm text-white/80">
                {programaCount === 1 ? "1 hito definido" : `${programaCount} hitos definidos`}
              </p>
            }
          >
            {!initial?.id ? (
              <p className="text-xs text-amber-200/90">Guardá el evento para editar el programa del día.</p>
            ) : programaHitosTableMissing ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                <p className="font-medium">El cronograma aún no está activo en tu entorno.</p>
                <p className="mt-1 text-xs text-amber-200/90">
                  Aplicá la migración del programa en la base de datos (p. ej. <code className="rounded bg-black/30 px-1">migration_evento_programa.sql</code>).
                </p>
              </div>
            ) : programaHitosError ? (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                No se pudo cargar el programa: {programaHitosError}
              </p>
            ) : (
              <div className="max-h-[min(70vh,44rem)] overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch] pr-0.5">
                <ProgramaHitosManager eventoId={initial.id} initialHitos={programaHitos} />
              </div>
            )}
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
                ).map(([value, optionLabel]) => (
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
                    <span>{optionLabel}</span>
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
                    <div className="h-32 animate-pulse rounded-lg border border-jurnex-primary/15 bg-black/20" aria-hidden />
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
