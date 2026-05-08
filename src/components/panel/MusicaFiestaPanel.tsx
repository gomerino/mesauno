"use client";

import { useMusicaFiestaEstado } from "@/hooks/useMusicaFiestaEstado";
import { panelBtnGhost, panelBtnSecondary } from "@/components/panel/ds";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  eventoId: string;
};

export function MusicaFiestaPanel({ eventoId }: Props) {
  const router = useRouter();
  const { data, reload } = useMusicaFiestaEstado({
    eventoId,
    enabled: Boolean(eventoId),
    usarRealtime: true,
    pollMs: 5000,
  });

  const [busy, setBusy] = useState<string | null>(null);

  async function postJson(url: string, body: Record<string, string>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const j = (await res.json()) as { ok?: boolean; message?: string };
    return { ok: res.ok && j.ok === true, message: j.message };
  }

  async function activar() {
    setBusy("activar");
    const r = await postJson("/api/musica/fiesta/activar", { evento_id: eventoId });
    setBusy(null);
    if (!r.ok) {
      toast.error(r.message ?? "No se pudo activar el modo fiesta.");
      return;
    }
    toast.success("Modo fiesta activo 🎉");
    await reload();
    router.refresh();
  }

  async function desactivar() {
    setBusy("desactivar");
    const r = await postJson("/api/musica/fiesta/desactivar", { evento_id: eventoId });
    setBusy(null);
    if (!r.ok) {
      toast.error(r.message ?? "No se pudo desactivar.");
      return;
    }
    toast.success("Modo fiesta desactivado.");
    await reload();
    router.refresh();
  }

  async function marcarReproducida(aporteId: string) {
    setBusy(`rep-${aporteId}`);
    const r = await postJson("/api/musica/fiesta/reproducida", { evento_id: eventoId, aporte_id: aporteId });
    setBusy(null);
    if (!r.ok) {
      toast.error(r.message ?? "No se pudo marcar.");
      return;
    }
    toast.success("Marcada como reproducida.");
    await reload();
    router.refresh();
  }

  async function recalcular() {
    setBusy("recalc");
    const r = await postJson("/api/musica/fiesta/recalcular", { evento_id: eventoId });
    setBusy(null);
    if (!r.ok) {
      toast.error(r.message ?? "No se pudo recalcular.");
      return;
    }
    toast.success("Cola actualizada.");
    await reload();
    router.refresh();
  }

  const activo = data?.modo_fiesta_activo === true;
  const rep = data?.en_reproduccion;

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-emerald-400/20 bg-black/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-white/90">Modo Fiesta en vivo</span>
        <Link
          href={`/panel/viaje/${eventoId}/dj`}
          className={`${panelBtnGhost} rounded-full border border-white/15 px-3 py-1.5 text-xs text-emerald-100/90`}
        >
          Modo DJ 🎧
        </Link>
        {!activo ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void activar()}
            className={`${panelBtnSecondary} rounded-full px-4 py-2 text-xs font-semibold`}
          >
            {busy === "activar" ? "…" : "Activar modo fiesta 🎉"}
          </button>
        ) : (
          <>
            <span className="text-xs font-medium text-emerald-200/90">Modo fiesta activo 🎉</span>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void desactivar()}
              className={`${panelBtnGhost} rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80`}
            >
              {busy === "desactivar" ? "…" : "Desactivar"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void recalcular()}
              className={`${panelBtnGhost} rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80`}
            >
              {busy === "recalc" ? "…" : "Recalcular cola"}
            </button>
          </>
        )}
      </div>

      {activo ? (
        <>
          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/45">En reproducción</h4>
            {rep ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-sm font-medium text-white">{rep.titulo}</p>
                <p className="text-xs text-white/55">{rep.artista}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#1ed760]" style={{ width: `${Math.round(rep.progreso_mock * 100)}%` }} />
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void marcarReproducida(rep.aporte_id)}
                  className={`mt-3 ${panelBtnSecondary} rounded-full px-3 py-1.5 text-[11px]`}
                >
                  {busy === `rep-${rep.aporte_id}` ? "…" : "Marcar como reproducida"}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-xs text-white/50">Sin tema en cola todavía.</p>
            )}
          </section>

          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Siguiente en la fila</h4>
            <ul className="mt-2 space-y-1 text-xs text-white/80">
              {data?.siguientes.length === 0 ? (
                <li className="text-white/45">—</li>
              ) : (
                data?.siguientes.map((s) => (
                  <li key={s.aporte_id}>
                    #{s.orden_cola} {s.titulo} <span className="text-white/50">— {s.artista}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Ranking en vivo</h4>
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
              {data?.ranking_en_vivo.map((it) => (
                <li key={it.aporte_id} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs">
                  <span className="font-medium text-white">{it.titulo}</span>
                  <span className="text-white/55"> — {it.artista}</span>
                  <span className="block text-[10px] text-emerald-200/80">{it.votos_live} votos en vivo</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-xs leading-relaxed text-white/50">
          Durante el evento puedes activar la votación en tiempo real y ver la cola. Los invitados ven la misma vista desde la
          invitación (actualización cada pocos segundos).
        </p>
      )}
    </div>
  );
}
