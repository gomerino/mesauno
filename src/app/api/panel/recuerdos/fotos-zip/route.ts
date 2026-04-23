import { selectEventoForMember } from "@/lib/evento-membership";
import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import type { RecuerdosZipPack } from "@/lib/recuerdos-fotos-constants";
import { type ProgramaHitoFotoPublic } from "@/lib/programa-con-fotos-publica";
import { loadProgramaConFotosHubForRecuerdos } from "@/lib/recuerdos-programa-con-fotos";
import { createClient } from "@/lib/supabase/server";
import AdmZip from "adm-zip";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_FOTOS = 400;
const MAX_FETCH_BYTES = 12 * 1024 * 1024;

type Body = {
  eventoId?: string;
  /** Qué lote: todas las del evento, solo ventanas de programa, o resto sin asignar a un momento. */
  pack?: RecuerdosZipPack;
  hitoId?: string | null;
};

function safeZipPart(s: string): string {
  const t = s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ\-\s]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
  return t || "momento";
}

function uniqueName(seen: Map<string, number>, base: string): string {
  const n = (seen.get(base) ?? 0) + 1;
  seen.set(base, n);
  if (n === 1) return base;
  const i = base.lastIndexOf(".");
  if (i > 0) {
    return `${base.slice(0, i)}-${n}${base.slice(i)}`;
  }
  return `${base}-${n}`;
}

async function fetchToZip(
  zip: AdmZip,
  entries: { pathInZip: string; publicUrl: string; storagePath: string }[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (const e of entries) {
    const res = await fetch(e.publicUrl);
    if (!res.ok) {
      return { ok: false, message: `No se pudo leer: ${e.storagePath}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_FETCH_BYTES) {
      return { ok: false, message: "Una imagen supera el máximo (12 MB) por archivo" };
    }
    zip.addFile(e.pathInZip, buf);
  }
  return { ok: true };
}

function buildEntriesForHito(
  hitoOrden: number,
  hitoTitle: string,
  fotos: ProgramaHitoFotoPublic[]
): { pathInZip: string; publicUrl: string; storagePath: string }[] {
  const nameCounts = new Map<string, number>();
  const folder = `${String(hitoOrden + 1).padStart(2, "0")}-${safeZipPart(hitoTitle)}`;
  return fotos.map((f) => {
    const baseRaw = f.storage_path.split("/").pop() || "foto.jpg";
    const base = uniqueName(nameCounts, baseRaw);
    return {
      pathInZip: `${folder}/${base}`,
      publicUrl: eventoFotoPublicUrl(f.storage_path),
      storagePath: f.storage_path,
    };
  });
}

function toProgramaFotos(
  rows: { id: string; storage_path: string; created_at: string }[]
): ProgramaHitoFotoPublic[] {
  return rows.map((r) => ({ id: r.id, storage_path: r.storage_path, created_at: r.created_at }));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const eventoId = typeof body.eventoId === "string" ? body.eventoId.trim() : "";
  if (!eventoId) {
    return NextResponse.json({ error: "Falta evento" }, { status: 400 });
  }

  const { data: scopeEvento, error: scopeErr } = await selectEventoForMember(supabase, user.id, "id");
  if (scopeErr) {
    return NextResponse.json({ error: "No se pudo verificar el evento" }, { status: 500 });
  }
  if (!scopeEvento?.id || (scopeEvento as { id: string }).id !== eventoId) {
    return NextResponse.json({ error: "Evento no permitido" }, { status: 403 });
  }

  const pack: RecuerdosZipPack = body.pack === "evento" || body.pack === "sin_momento" ? body.pack : "programa";

  const { data: rowsRaw, error: allErr } = await supabase
    .from("evento_fotos")
    .select("id, storage_path, created_at")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false });

  if (allErr) {
    return NextResponse.json({ error: allErr.message }, { status: 502 });
  }
  const allRows = (rowsRaw ?? []) as { id: string; storage_path: string; created_at: string }[];

  type HubT = Awaited<ReturnType<typeof loadProgramaConFotosHubForRecuerdos>>;
  let hub: HubT = null;
  const needHub = pack === "programa" || pack === "sin_momento";
  if (needHub) {
    hub = await loadProgramaConFotosHubForRecuerdos(supabase, eventoId);
  }

  const zip = new AdmZip();
  const entries: { pathInZip: string; publicUrl: string; storagePath: string }[] = [];

  if (pack === "evento") {
    const fotos = toProgramaFotos(allRows);
    if (fotos.length > MAX_FOTOS) {
      return NextResponse.json(
        { error: `Límite de ${MAX_FOTOS} imágenes por descarga. Contactá a soporte si necesitás un export mayor.` },
        { status: 400 }
      );
    }
    if (fotos.length === 0) {
      return NextResponse.json({ error: "No hay fotos en el evento" }, { status: 404 });
    }
    entries.push(...buildEntriesForHito(0, "Fotos del evento", fotos));
  } else if (pack === "sin_momento") {
    const inPrograma = new Set<string>();
    if (hub) {
      for (const h of hub.hitos) {
        for (const f of h.fotos) inPrograma.add(f.storage_path);
      }
    }
    const sueltas = allRows.filter((r) => !inPrograma.has(r.storage_path));
    const fotos = toProgramaFotos(sueltas);
    if (fotos.length > MAX_FOTOS) {
      return NextResponse.json({ error: "Demasiadas imágenes en un solo lote" }, { status: 400 });
    }
    if (fotos.length === 0) {
      return NextResponse.json({ error: "No hay fotos sin asignar" }, { status: 404 });
    }
    entries.push(...buildEntriesForHito(0, "Fotos sin asignar", fotos));
  } else {
    if (!hub) {
      return NextResponse.json(
        { error: "No se pudo cargar el programa. Probá con «Todas las fotos (ZIP)» o reintentá luego." },
        { status: 502 }
      );
    }
    const hitoId = typeof body.hitoId === "string" && body.hitoId.trim() ? body.hitoId.trim() : null;
    if (hitoId) {
      const h = hub.hitos.find((x) => x.hito_id === hitoId);
      if (!h || h.fotos.length === 0) {
        return NextResponse.json({ error: "No hay fotos para este momento" }, { status: 404 });
      }
      if (h.fotos.length > MAX_FOTOS) {
        return NextResponse.json({ error: "Demasiadas imágenes en un solo lote" }, { status: 400 });
      }
      entries.push(...buildEntriesForHito(h.orden, h.titulo, h.fotos));
    } else {
      const conFotos = hub.hitos.filter((h) => h.fotos.length > 0);
      let total = 0;
      for (const h of conFotos) {
        for (const f of h.fotos) {
          total += 1;
          if (total > MAX_FOTOS) {
            return NextResponse.json(
              { error: `Límite de ${MAX_FOTOS} imágenes por descarga. Bajá por momento o usá la descarga completa del evento.` },
              { status: 400 }
            );
          }
        }
      }
      if (conFotos.length === 0) {
        return NextResponse.json({ error: "No hay fotos en el programa" }, { status: 404 });
      }
      const usedPaths = new Set<string>();
      for (const h of conFotos) {
        const uniques: ProgramaHitoFotoPublic[] = [];
        for (const f of h.fotos) {
          if (usedPaths.has(f.storage_path)) continue;
          usedPaths.add(f.storage_path);
          uniques.push(f);
        }
        entries.push(...buildEntriesForHito(h.orden, h.titulo, uniques));
      }
    }
  }

  const toZip = await fetchToZip(zip, entries);
  if (!toZip.ok) {
    return NextResponse.json({ error: toZip.message }, { status: 502 });
  }

  const hitoIdForName = pack === "programa" && typeof body.hitoId === "string" && body.hitoId.trim() ? body.hitoId.trim() : null;
  const filename =
    pack === "evento"
      ? "recuerdos-todas-las-fotos.zip"
      : pack === "sin_momento"
        ? "recuerdos-sin-momento-asignado.zip"
        : hitoIdForName
          ? `recuerdos-${safeZipPart(hub?.hitos.find((x) => x.hito_id === hitoIdForName)?.titulo ?? "momento")}.zip`
          : "recuerdos-programa-segun-cronograma.zip";
  const buf = zip.toBuffer();
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename).replace(/'/g, "%27")}"`,
    },
  });
}
