"use client";

import { RECUERDOS_ALBUM_EVENTO_ID, RECUERDOS_SIN_MOMENTO_HITO_ID, type RecuerdosZipPack } from "@/lib/recuerdos-fotos-constants";
import { markRecuerdosFotosDownloadMision } from "@/lib/recuerdos-mission";
import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import type { ProgramaConFotosHitoParsed, ProgramaHitoFotoPublic } from "@/lib/programa-con-fotos-publica";
import { ChevronDown, Download, Images } from "lucide-react";
import { Fragment, useState } from "react";

const MAX_FOTOS_VISIBLE = 12;

export type RecuerdosFotoBloque = {
  hito: ProgramaConFotosHitoParsed;
  /** Cómo armar el ZIP en el servidor. */
  zip: { pack: RecuerdosZipPack; hitoId?: string };
  /** 1, 2, 3… en el cronograma (solo momentos de programa con `pack === "programa"`). */
  indiceEnPrograma?: number;
};

type Props = {
  eventoId: string;
  bloques: RecuerdosFotoBloque[];
  totalFotos: number;
};

function formatHora(hora: string, hitoId: string): string {
  if (hitoId === RECUERDOS_ALBUM_EVENTO_ID) return "Todo el evento";
  if (hitoId === RECUERDOS_SIN_MOMENTO_HITO_ID) return "Sin ventana de programa";
  const s = hora.trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?/.test(s)) return s.slice(0, 5);
  return s;
}

async function postZip(
  eventoId: string,
  options: { pack: RecuerdosZipPack; hitoId?: string }
): Promise<{ ok: true; blob: Blob; filename: string } | { ok: false; message: string }> {
  const { pack, hitoId } = options;
  const body: Record<string, string> = { eventoId, pack };
  if (pack === "programa" && hitoId) {
    body.hitoId = hitoId;
  }
  const res = await fetch("/api/panel/recuerdos/fotos-zip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const cd = res.headers.get("Content-Disposition");
  let filename = "recuerdos.zip";
  if (cd) {
    const m = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(cd);
    if (m?.[1]) {
      try {
        filename = decodeURIComponent(m[1].replace(/"/g, "").trim());
      } catch {
        // keep default
      }
    }
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, message: j?.error ?? res.statusText };
  }
  const blob = await res.blob();
  return { ok: true, blob, filename };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function bloqueKey(b: RecuerdosFotoBloque) {
  return `${b.hito.hito_id}:${b.zip.pack}${b.zip.hitoId ? `-${b.zip.hitoId}` : ""}`;
}

function FotoThumbs({ fotos, groupLabel }: { fotos: ProgramaHitoFotoPublic[]; groupLabel: string }) {
  const visible = fotos.slice(0, MAX_FOTOS_VISIBLE);
  const rest = fotos.length - visible.length;
  if (fotos.length === 0) return null;
  return (
    <div className="mt-3 w-full border-t border-white/[0.06] pt-3">
      <div className="flex flex-wrap gap-1.5">
        {visible.map((f) => {
          const href = eventoFotoPublicUrl(f.storage_path);
          return (
            <a
              key={f.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block overflow-hidden rounded-lg border border-white/10 bg-black/20 ring-0 transition hover:border-teal-400/40 hover:ring-1 hover:ring-teal-400/20"
            >
              {/* Miniaturas: URLs públicas de Supabase; <img> ad-hoc (origen dinámico). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={href}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-16 w-16 object-cover sm:h-20 sm:w-20"
              />
              <span className="sr-only">
                Abrir imagen, {groupLabel}
              </span>
            </a>
          );
        })}
      </div>
      {rest > 0 ? <p className="mt-2 text-xs text-white/45">+{rest} más (completas en el ZIP)</p> : null}
    </div>
  );
}

export function RecuerdosProgramaFotosClient({ eventoId, bloques, totalFotos }: Props) {
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const downloadBloque = async (b: RecuerdosFotoBloque) => {
    setErr(null);
    setLoadingKey(bloqueKey(b));
    try {
      const r = await postZip(eventoId, b.zip);
      if (r.ok) {
        triggerDownload(r.blob, r.filename);
      } else {
        setErr(r.message);
      }
    } finally {
      setLoadingKey(null);
    }
  };

  const downloadTodasLasDelEvento = async () => {
    setErr(null);
    setLoadingAll(true);
    try {
      const r = await postZip(eventoId, { pack: "evento" });
      if (r.ok) {
        markRecuerdosFotosDownloadMision(eventoId);
        triggerDownload(r.blob, r.filename);
      } else {
        setErr(r.message);
      }
    } finally {
      setLoadingAll(false);
    }
  };

  if (bloques.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
        Todavía no hay fotos subidas al evento. Cuando los invitados aporten imágenes, vas a verlas acá
        (por momento del programa o, si no aplica, el álbum completo).
      </div>
    );
  }

  return (
    <div className="mt-2">
      <details className="group rounded-xl border border-white/10 bg-black/30" open>
        <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <h2 className="text-left text-sm font-semibold text-white/90">Fotos por momento</h2>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              void downloadTodasLasDelEvento();
            }}
            className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-full border border-teal-500/50 bg-teal-500/15 px-4 text-sm font-medium text-teal-200 transition hover:border-teal-400/60 hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
            disabled={loadingAll || totalFotos === 0}
          >
            {loadingAll ? (
              "Preparando…"
            ) : (
              <>
                <Download className="h-4 w-4" aria-hidden />
                Descargar todas en ZIP ({totalFotos})
              </>
            )}
          </button>
        </summary>
        <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-2">
          {err ? <p className="text-sm text-rose-300/90">{err}</p> : null}
          <ul className="flex flex-col gap-2">
            {bloques.map((b, i) => {
              const { hito: h, zip: z, indiceEnPrograma } = b;
              const n = h.fotos.length;
              const k = bloqueKey(b);
              const busy = loadingKey === k;
              const timeLabel = formatHora(h.hora, h.hito_id);
              const esPrograma = z.pack === "programa";
              const prev = i > 0 ? bloques[i - 1] : null;
              const showOtras = prev && prev.zip.pack === "programa" && z.pack !== "programa";
              return (
                <Fragment key={k}>
                  {showOtras ? (
                    <li className="list-none border-0 bg-transparent py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Más allá de los momentos
                    </li>
                  ) : null}
                  <li
                    className={`flex flex-col rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 ${
                      esPrograma ? "border-l-[3px] border-l-teal-400/45 border-t-white/10" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        {esPrograma && indiceEnPrograma != null ? (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300/80">
                            Momento {indiceEnPrograma}
                          </p>
                        ) : null}
                        {esPrograma ? (
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="inline-flex rounded-md border border-white/10 bg-white/[0.08] px-2 py-0.5 font-mono text-sm font-semibold tabular-nums text-white">
                              {timeLabel}
                            </span>
                            <span className="min-w-0 break-words text-base font-semibold leading-snug text-white md:text-lg">
                              {h.titulo}
                            </span>
                          </div>
                        ) : (
                          <div className="flex min-w-0 items-start gap-2">
                            <span className="mt-1 text-white/35" aria-hidden>
                              <Images className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-white/95">{h.titulo}</p>
                              <p className="mt-0.5 text-xs text-white/50">
                                {timeLabel}
                                {z.pack === "evento" ? " · álbum del evento" : null}
                                {z.pack === "sin_momento" ? " · sin ventana del cronograma" : null}
                              </p>
                            </div>
                          </div>
                        )}
                        {h.descripcion_corta && esPrograma ? (
                          <p className="mt-1.5 text-sm text-white/50">{h.descripcion_corta}</p>
                        ) : null}
                        {esPrograma ? (
                          <p className="mt-1.5 text-xs text-white/40">
                            {n === 0
                              ? "Aún no hay fotos asignadas a este tramo horario"
                              : `${n} ${n === 1 ? "foto" : "fotos"} en este momento`}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadBloque(b)}
                        disabled={busy || n === 0}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 self-stretch rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/25 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[5.5rem] sm:self-start"
                      >
                        {busy ? (
                          "…"
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" aria-hidden />
                            ZIP
                          </>
                        )}
                      </button>
                    </div>
                    {n > 0 ? (
                      <FotoThumbs fotos={h.fotos} groupLabel={h.titulo} />
                    ) : null}
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      </details>
    </div>
  );
}
