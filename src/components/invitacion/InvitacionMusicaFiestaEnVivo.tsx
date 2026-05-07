"use client";

import { useMusicaFiestaEstado } from "@/hooks/useMusicaFiestaEstado";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  eventoId: string;
  invitationAccessToken?: string;
  modoFiestaActivo: boolean;
  surface?: "dark" | "light";
};

export function InvitacionMusicaFiestaEnVivo({
  eventoId,
  invitationAccessToken = "",
  modoFiestaActivo,
  surface = "dark",
}: Props) {
  const router = useRouter();
  const token = invitationAccessToken.trim();
  const esInvitacion = Boolean(token);
  const light = surface === "light";
  const { data, reload } = useMusicaFiestaEstado({
    eventoId,
    invitacionToken: token,
    enabled: modoFiestaActivo && Boolean(eventoId),
    usarRealtime: false,
    pollMs: 5000,
  });

  const [votandoId, setVotandoId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!modoFiestaActivo || !data?.modo_fiesta_activo) return null;

  async function votarLive(aporteId: string) {
    setMsg(null);
    setVotandoId(aporteId);
    try {
      const body: Record<string, string> = { evento_id: eventoId, aporte_id: aporteId };
      if (token) body.invitacion_token = token;
      const res = await fetch("/api/musica/fiesta/votar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: esInvitacion ? "same-origin" : "include",
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !j.ok) {
        setMsg(j.message ?? "No se pudo votar.");
        return;
      }
      await reload();
      router.refresh();
    } catch {
      setMsg("Error de red.");
    } finally {
      setVotandoId(null);
    }
  }

  const cardBorder = light ? "border-invite-navy/12 bg-invite-sand/80" : "border-white/15 bg-black/25";
  const titleCls = light ? "text-invite-navy" : "text-white";
  const muted = light ? "text-invite-navy/60" : "text-zinc-400";
  const btnVoteOn = light ? "border-emerald-600/45 bg-emerald-50 text-emerald-900" : "border-[#1ed760]/55 bg-[#1ed760]/20 text-[#1ed760]";
  const btnVoteOff = light ? "border-invite-navy/15 bg-white text-invite-navy" : "border-white/15 bg-white/5 text-white";

  const rep = data.en_reproduccion;

  return (
    <div className={`mt-4 space-y-4 rounded-2xl border p-3 ${cardBorder}`}>
      <p className={`text-center text-sm font-semibold ${titleCls}`}>Modo fiesta activo 🎉</p>
      <p className={`text-center text-xs ${muted}`}>Vota la siguiente canción 🎧</p>

      {msg ? (
        <p className={`text-center text-xs ${light ? "text-red-700" : "text-red-300"}`} role="alert">
          {msg}
        </p>
      ) : null}

      <section aria-labelledby="fiesta-ahora">
        <h3 id="fiesta-ahora" className={`text-[10px] font-semibold uppercase tracking-widest ${muted}`}>
          En reproducción
        </h3>
        {rep ? (
          <div className={`mt-2 rounded-xl border px-3 py-2 ${light ? "border-invite-navy/10 bg-white" : "border-white/10 bg-black/35"}`}>
            <div className="flex gap-3">
              {rep.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rep.imagen} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${titleCls}`}>{rep.titulo}</p>
                <p className={`text-xs ${muted}`}>{rep.artista}</p>
              </div>
            </div>
            <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${light ? "bg-invite-navy/10" : "bg-white/10"}`}>
              <div
                className={`h-full rounded-full ${light ? "bg-invite-gold" : "bg-[#1ed760]"}`}
                style={{ width: `${Math.round(rep.progreso_mock * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className={`mt-1 text-xs ${muted}`}>La cola se arma cuando haya canciones aprobadas.</p>
        )}
      </section>

      <section aria-labelledby="fiesta-siguiente">
        <h3 id="fiesta-siguiente" className={`text-[10px] font-semibold uppercase tracking-widest ${muted}`}>
          Siguiente en la fila
        </h3>
        <ul className="mt-2 space-y-1.5">
          {data.siguientes.length === 0 ? (
            <li className={`text-xs ${muted}`}>—</li>
          ) : (
            data.siguientes.map((s) => (
              <li key={s.aporte_id} className={`text-xs ${titleCls}`}>
                <span className="font-semibold tabular-nums">#{s.orden_cola}</span> {s.titulo}{" "}
                <span className={muted}>— {s.artista}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section aria-labelledby="fiesta-ranking">
        <h3 id="fiesta-ranking" className={`text-[10px] font-semibold uppercase tracking-widest ${muted}`}>
          Más votadas ahora
        </h3>
        <ul className="mt-2 space-y-2">
          {data.ranking_en_vivo.map((it) => (
            <li
              key={it.aporte_id}
              className={`flex flex-wrap items-start gap-2 rounded-xl border px-3 py-2 ${
                light ? "border-invite-navy/10 bg-white" : "border-white/10 bg-black/30"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${titleCls}`}>{it.titulo}</p>
                <p className={`text-xs ${muted}`}>{it.artista}</p>
                <p className={`mt-0.5 text-[10px] ${muted}`}>{it.votos_live} votos en vivo</p>
              </div>
              <button
                type="button"
                disabled={it.ya_voto_live || votandoId === it.aporte_id}
                onClick={() => void votarLive(it.aporte_id)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-55 ${
                  it.ya_voto_live ? btnVoteOn : btnVoteOff
                }`}
                aria-pressed={it.ya_voto_live}
              >
                👍 +1
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
