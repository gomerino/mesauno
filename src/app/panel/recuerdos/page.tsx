import { RecuerdosMisionBlock } from "@/components/panel/recuerdos/RecuerdosMisionBlock";
import { RecuerdosProgramaFotosClient, type RecuerdosFotoBloque } from "@/components/panel/recuerdos/RecuerdosProgramaFotosClient";
import { PanelLayout } from "@/components/panel/ds";
import { RECUERDOS_ALBUM_EVENTO_ID, RECUERDOS_SIN_MOMENTO_HITO_ID } from "@/lib/recuerdos-fotos-constants";
import { type ProgramaConFotosHitoParsed, type ProgramaHitoFotoPublic } from "@/lib/programa-con-fotos-publica";
import { loadProgramaConFotosHubForRecuerdos } from "@/lib/recuerdos-programa-con-fotos";
import type { EventoProgramaHito } from "@/types/database";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import {
  PANEL_RECUERDOS_EYEBROW,
  PANEL_RECUERDOS_SUBTITLE,
  PANEL_RECUERDOS_TITLE,
  panelJourneyPageWrapClass,
  panelSectionEyebrowClass,
  panelSectionSubtitleClass,
  panelSectionTitleClass,
} from "@/lib/panel-section-copy";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

function toFotosList(rows: { id: string; storage_path: string; created_at: string }[]): ProgramaHitoFotoPublic[] {
  return rows.map((r) => ({
    id: r.id,
    storage_path: r.storage_path,
    created_at: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at as string).toISOString(),
  }));
}

/** Mismo criterio que en `parseHitos`: orden del cronograma, luego hora. */
function ordenMismoHitos(a: { orden: number; hora: string }, b: { orden: number; hora: string }): number {
  if (a.orden !== b.orden) return a.orden - b.orden;
  return a.hora.localeCompare(b.hora);
}

function ordenFotosPorFecha(fotos: ProgramaHitoFotoPublic[], asc = true): ProgramaHitoFotoPublic[] {
  return [...fotos].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return asc ? ta - tb : tb - ta;
  });
}

export default async function PanelRecuerdosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await loadPanelProgressBundle(user!.id);
  const evento = bundle.evento;

  const bloques: RecuerdosFotoBloque[] = [];
  let totalFotos = 0;

  if (evento?.id) {
    const { data: filas, error: fotosErr } = await supabase
      .from("evento_fotos")
      .select("id, storage_path, created_at")
      .eq("evento_id", evento.id)
      .order("created_at", { ascending: false });
    if (!fotosErr) {
      const todas = toFotosList((filas ?? []) as { id: string; storage_path: string; created_at: string }[]);
      const paths = new Set(todas.map((f) => f.storage_path));
      totalFotos = paths.size;

      const hub = await loadProgramaConFotosHubForRecuerdos(supabase, evento.id);

      const inPrograma = new Set<string>();
      if (hub) {
        for (const h of hub.hitos) {
          for (const f of h.fotos) inPrograma.add(f.storage_path);
        }
        const hitosOrdenados = [...hub.hitos]
          .map((h) => ({ ...h, fotos: ordenFotosPorFecha(h.fotos) }))
          .sort(ordenMismoHitos);
        let idx = 0;
        for (const h of hitosOrdenados) {
          idx += 1;
          bloques.push({ hito: h, zip: { pack: "programa", hitoId: h.hito_id }, indiceEnPrograma: idx });
        }
      } else {
        const { data: hitosDb, error: hitosErr } = await supabase
          .from("evento_programa_hitos")
          .select("id, hora, titulo, descripcion_corta, lugar_nombre, ubicacion_url, icono, orden")
          .eq("evento_id", evento.id)
          .order("orden", { ascending: true });
        if (!hitosErr && hitosDb?.length) {
          const rows = hitosDb as EventoProgramaHito[];
          const sorted = [...rows].sort(ordenMismoHitos);
          let idx = 0;
          for (const r of sorted) {
            idx += 1;
            const fila: ProgramaConFotosHitoParsed = {
              hito_id: r.id,
              orden: r.orden,
              hora: r.hora,
              titulo: r.titulo,
              descripcion_corta: r.descripcion_corta,
              lugar_nombre: r.lugar_nombre,
              ubicacion_url: r.ubicacion_url,
              icono: r.icono,
              fotos: [],
            };
            bloques.push({ hito: fila, zip: { pack: "programa", hitoId: r.id }, indiceEnPrograma: idx });
          }
        }
      }
      const sueltas = ordenFotosPorFecha(todas.filter((f) => !inPrograma.has(f.storage_path)));
      if (sueltas.length) {
        if (hub && hub.hitos.length > 0) {
          const m: ProgramaConFotosHitoParsed = {
            hito_id: RECUERDOS_SIN_MOMENTO_HITO_ID,
            orden: 10_000,
            hora: "23:59:59",
            titulo: "Fotos sin asignar a un momento",
            descripcion_corta: "Fechas de subida que no entran en ninguna ventana del cronograma.",
            lugar_nombre: null,
            ubicacion_url: null,
            icono: "Music",
            fotos: sueltas,
          };
          bloques.push({ hito: m, zip: { pack: "sin_momento" } });
        } else {
          const m: ProgramaConFotosHitoParsed = {
            hito_id: RECUERDOS_ALBUM_EVENTO_ID,
            orden: 0,
            hora: "00:00:00",
            titulo: "Fotos del evento",
            descripcion_corta: "Todas las imágenes aportadas al evento (sin vinculación a momentos).",
            lugar_nombre: null,
            ubicacion_url: null,
            icono: "Music",
            fotos: sueltas,
          };
          bloques.push({ hito: m, zip: { pack: "evento" } });
        }
      }
    }
  }

  return (
    <PanelLayout>
      <div className={panelJourneyPageWrapClass}>
        <header className="space-y-1">
          <p className={panelSectionEyebrowClass}>{PANEL_RECUERDOS_EYEBROW}</p>
          <h1 className={panelSectionTitleClass}>{PANEL_RECUERDOS_TITLE}</h1>
          <p className={`${panelSectionSubtitleClass} max-w-xl`}>{PANEL_RECUERDOS_SUBTITLE}</p>
        </header>

        {evento ? (
          <>
            <RecuerdosMisionBlock eventoId={evento.id} />
            <RecuerdosProgramaFotosClient eventoId={evento.id} bloques={bloques} totalFotos={totalFotos} />
          </>
        ) : null}

        <ul className="flex flex-col gap-3 text-sm">
        <li>
          <Link
            href="/panel/finanzas"
            className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/85 transition hover:border-teal-400/30 hover:bg-white/[0.06]"
          >
            <span className="font-medium text-white">Regalos y números</span>
            <span className="mt-1 block text-xs text-white/50">Lista de regalos y seguimiento</span>
          </Link>
        </li>
        <li>
          <Link
            href="/panel/pasajeros/vista"
            className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/85 transition hover:border-teal-400/30 hover:bg-white/[0.06]"
          >
            <span className="font-medium text-white">Vista previa del pase</span>
            <span className="mt-1 block text-xs text-white/50">Cómo ven tu invitación quienes vuelan con ustedes</span>
          </Link>
        </li>
      </ul>
      </div>
    </PanelLayout>
  );
}
