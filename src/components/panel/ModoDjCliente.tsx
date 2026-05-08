"use client";

import { panelBtnGhost, panelBtnSecondary } from "@/components/panel/ds";
import { useMusicaFiestaEstado } from "@/hooks/useMusicaFiestaEstado";
import type { MusicaFiestaEstadoRespuesta } from "@/lib/musica-fiesta-en-vivo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  eventoId: string;
  /** Para `/dj/[eventoId]?dj_acceso=` sin sesión. */
  djAccesoToken?: string;
  /** Panel novios (admin): enlace privado y sync cola con votos. */
  mostrarControlesAdmin?: boolean;
};

function formatMmSs(totalSeg: number): string {
  const s = Math.max(0, Math.floor(totalSeg));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function useDjTiempoSimulado(data: MusicaFiestaEstadoRespuesta | null) {
  const [pulse, setPulse] = useState(0);
  const anchorRef = useRef<{ enMs: number; segundos: number }>({ enMs: Date.now(), segundos: 0 });

  useEffect(() => {
    anchorRef.current = {
      enMs: Date.now(),
      segundos: data?.dj_estado?.segundos_transcurridos ?? 0,
    };
  }, [
    data?.dj_estado?.segundos_transcurridos,
    data?.dj_estado?.reproduciendo,
    data?.en_reproduccion?.aporte_id,
  ]);

  useEffect(() => {
    if (!data?.dj_estado?.reproduciendo) return;
    const id = window.setInterval(() => setPulse((p) => p + 1), 500);
    return () => window.clearInterval(id);
  }, [data?.dj_estado?.reproduciendo]);

  return useMemo(() => {
    const dur = data?.dj_estado?.duracion_segundos ?? 180;
    if (!data?.dj_estado) return { elapsed: 0, dur, progress: 0 };
    const base = anchorRef.current.segundos;
    const extra =
      data.dj_estado.reproduciendo && typeof anchorRef.current.enMs === "number"
        ? Math.floor((Date.now() - anchorRef.current.enMs) / 1000)
        : 0;
    const elapsed = Math.min(dur, base + Math.max(0, extra));
    const progress = dur > 0 ? elapsed / dur : 0;
    return { elapsed, dur, progress };
  }, [
    data?.dj_estado,
    data?.dj_estado?.reproduciendo,
    data?.dj_estado?.duracion_segundos,
    data?.dj_estado?.segundos_transcurridos,
    data?.en_reproduccion?.aporte_id,
    pulse,
  ]);
}

export function ModoDjCliente({ eventoId, djAccesoToken = "", mostrarControlesAdmin }: Props) {
  const router = useRouter();
  const token = djAccesoToken.trim();
  const esSesionPanel = !token;

  const { data, reload } = useMusicaFiestaEstado({
    eventoId,
    djAcceso: token,
    enabled: Boolean(eventoId),
    usarRealtime: esSesionPanel,
    pollMs: 2500,
  });

  const { elapsed, dur, progress } = useDjTiempoSimulado(data);
  const autoSiguienteDisparado = useRef(false);

  const postDj = useCallback(
    async (path: string, payload: Record<string, unknown>) => {
      const body: Record<string, unknown> = { ...payload, evento_id: eventoId };
      if (token) body.dj_acceso = token;
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: esSesionPanel ? "include" : "same-origin",
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { ok?: boolean; message?: string };
      return { ok: res.ok && j.ok === true, message: j.message };
    },
    [eventoId, token, esSesionPanel]
  );

  useEffect(() => {
    autoSiguienteDisparado.current = false;
  }, [data?.en_reproduccion?.aporte_id]);

  useEffect(() => {
    if (!data?.dj_estado?.auto || !data?.en_reproduccion || !data.dj_estado.reproduciendo) return;
    if (elapsed < dur || autoSiguienteDisparado.current) return;
    autoSiguienteDisparado.current = true;
    void (async () => {
      const r = await postDj("/api/musica/dj/siguiente", {});
      if (!r.ok) {
        autoSiguienteDisparado.current = false;
        return;
      }
      await reload();
      router.refresh();
    })();
  }, [data?.dj_estado?.auto, data?.en_reproduccion, data?.dj_estado?.reproduciendo, elapsed, dur, postDj, reload, router]);

  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(id);
    try {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.message ?? "No se pudo completar la acción.");
        return;
      }
      await reload();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!data?.modo_fiesta_activo) {
    return (
      <div className="rounded-xl border border-amber-400/25 bg-black/25 p-4 text-sm text-white/85">
        <p className="font-semibold text-white">Modo DJ</p>
        <p className="mt-2 text-white/65">
          Activa primero el modo fiesta en Viaje → Música para usar la consola DJ con votación en vivo y la cola.
        </p>
        {mostrarControlesAdmin ? (
          <Link
            href="/panel/viaje"
            className={`mt-3 inline-flex ${panelBtnSecondary} rounded-full px-4 py-2 text-xs font-semibold`}
          >
            Ir a Viaje
          </Link>
        ) : null}
      </div>
    );
  }

  const rep = data.en_reproduccion;
  const ranking = [...data.ranking_en_vivo].sort((a, b) => b.votos_live - a.votos_live || b.votos - a.votos);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">Modo DJ activo 🎧</p>
        <h1 className="text-lg font-semibold text-white">Controla la música del evento</h1>
      </header>

      {mostrarControlesAdmin ? (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/75">
          <p className="font-semibold text-white/90">Enlace privado para DJ</p>
          <p className="mt-1 text-white/55">Compartí el token solo con la persona que mezcla en vivo.</p>
          <button
            type="button"
            disabled={busy !== null}
            className={`mt-3 ${panelBtnSecondary} rounded-full px-3 py-1.5 text-[11px] font-semibold`}
            onClick={() =>
              void (async () => {
                setBusy("token");
                try {
                  const body: Record<string, unknown> = { evento_id: eventoId };
                  const res = await fetch("/api/musica/dj/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(body),
                  });
                  const j = (await res.json()) as { ok?: boolean; url_enlace_dj?: string; message?: string };
                  if (!res.ok || !j.ok) {
                    toast.error(j.message ?? "No se pudo generar el enlace.");
                    return;
                  }
                  if (j.url_enlace_dj) {
                    try {
                      await navigator.clipboard.writeText(j.url_enlace_dj);
                      toast.success("Enlace DJ copiado al portapapeles.");
                    } catch {
                      toast.message(j.url_enlace_dj, { duration: 8000 });
                    }
                  }
                  await reload();
                  router.refresh();
                } finally {
                  setBusy(null);
                }
              })()
            }
          >
            {busy === "token" ? "…" : "Generar o renovar enlace"}
          </button>
          <label className="mt-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={data.dj_estado?.sincronizar_cola_con_votos !== false}
              disabled={busy !== null}
              onChange={(e) => {
                const sincronizar = e.target.checked;
                void run("sync-col", async () => postDj("/api/musica/dj/sincronizar-cola", { sincronizar }));
              }}
            />
            <span>Sincronizar cola automática con votos (cuando está activo, cada voto reordena el top 10).</span>
          </label>
        </section>
      ) : null}

      <section className="rounded-xl border border-emerald-400/20 bg-black/20 p-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-white/45">En reproducción</h2>
        {rep ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            {rep.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.imagen} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xl text-white/40">
                ♫
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{rep.titulo}</p>
              <p className="truncate text-xs text-white/55">{rep.artista}</p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-emerald-200/90">
                {formatMmSs(elapsed)} / {formatMmSs(dur)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#1ed760]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-white/50">No hay tema en curso. Reproducí para tomar el primero de la cola.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null || data.cola.length === 0}
            className={`${panelBtnSecondary} rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-45`}
            onClick={() => void run("play", async () => postDj("/api/musica/dj/reproducir", {}))}
          >
            {busy === "play" ? "…" : "▶️ Reproducir"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            className={`${panelBtnGhost} rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/85`}
            onClick={() => void run("pause", async () => postDj("/api/musica/dj/pausar", {}))}
          >
            {busy === "pause" ? "…" : "⏸️ Pausar"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            className={`${panelBtnGhost} rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/85`}
            onClick={() => void run("next", async () => postDj("/api/musica/dj/siguiente", {}))}
          >
            {busy === "next" ? "…" : "⏭️ Siguiente"}
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80">
            <input
              type="checkbox"
              checked={data.dj_estado?.auto === true}
              disabled={busy !== null}
              onChange={(e) => {
                void run("auto", async () => postDj("/api/musica/dj/auto", { activo: e.target.checked }));
              }}
            />
            Auto DJ
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/15 p-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Siguiente en la cola</h2>
        <ul className="mt-3 space-y-2">
          {data.cola.length === 0 ? (
            <li className="text-xs text-white/45">La cola está vacía. Agrega desde el ranking en vivo.</li>
          ) : (
            data.cola.map((it) => (
              <li
                key={it.aporte_id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85"
              >
                <span className="font-mono text-[11px] tabular-nums text-emerald-200/90">#{it.orden_cola}</span>
                <span className="min-w-0 flex-1 font-medium text-white">
                  {it.titulo} <span className="font-normal text-white/50">— {it.artista}</span>
                </span>
                <span className="text-[10px] text-white/45">
                  {it.votos_live} en vivo · {it.votos} hist.
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    disabled={busy !== null}
                    className={`${panelBtnGhost} rounded-md border border-white/12 px-2 py-0.5 text-[10px]`}
                    onClick={() =>
                      void run(`up-${it.aporte_id}`, async () =>
                        postDj("/api/musica/dj/cola/mover", { aporte_id: it.aporte_id, direccion: "arriba" })
                      )
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    className={`${panelBtnGhost} rounded-md border border-white/12 px-2 py-0.5 text-[10px]`}
                    onClick={() =>
                      void run(`down-${it.aporte_id}`, async () =>
                        postDj("/api/musica/dj/cola/mover", { aporte_id: it.aporte_id, direccion: "abajo" })
                      )
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    className={`${panelBtnGhost} rounded-md border border-white/12 px-2 py-0.5 text-[10px] text-rose-200/90`}
                    onClick={() =>
                      void run(`rm-${it.aporte_id}`, async () =>
                        postDj("/api/musica/dj/cola/quitar", { aporte_id: it.aporte_id })
                      )
                    }
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/15 p-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Ranking en vivo</h2>
        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {ranking.map((it) => (
            <li
              key={it.aporte_id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{it.titulo}</p>
                <p className="text-[11px] text-white/50">{it.artista}</p>
                <p className="mt-0.5 text-[10px] text-emerald-200/75">{it.votos_live} votos en vivo</p>
              </div>
              <button
                type="button"
                disabled={busy !== null || it.en_cola || it.reproducida}
                className={`${panelBtnSecondary} shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-45`}
                onClick={() =>
                  void run(`add-${it.aporte_id}`, async () =>
                    postDj("/api/musica/dj/cola/agregar", { aporte_id: it.aporte_id })
                  )
                }
              >
                Agregar a cola
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
