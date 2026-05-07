"use client";

import { InvitacionMusicaFiestaEnVivo } from "@/components/invitacion/InvitacionMusicaFiestaEnVivo";
import {
  MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA,
  type MusicaListaItem,
} from "@/lib/musica-colaborativa";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ApiTrack = {
  uri: string;
  id: string;
  name: string;
  artists: string;
  album: string;
  imageUrl: string | null;
};

function spotifyTrackIdDesdeResultado(track: ApiTrack): string {
  const id = typeof track.id === "string" ? track.id.trim() : "";
  if (id) return id;
  const uri = typeof track.uri === "string" ? track.uri.trim() : "";
  const m = /^spotify:track:([a-zA-Z0-9]+)$/.exec(uri);
  return m?.[1] ?? "";
}

type Props = {
  /** Token público de la invitación; vacío en panel novios (usa sesión). */
  invitationAccessToken?: string;
  eventoId: string;
  /** En invitación: solo con RSVP confirmado se permite agregar y ver lista completa operativa. */
  invitacionConfirmada?: boolean;
  /** Si hay cuenta Spotify vinculada al evento, los admins pueden disparar sync manual. */
  spotifySyncDisponible?: boolean;
  /** `light`: tarjeta clara (SoftAviation). Por defecto bloque oscuro. */
  surface?: "dark" | "light";
};

export function InvitacionMusicaColaborativa({
  invitationAccessToken = "",
  eventoId,
  invitacionConfirmada = true,
  spotifySyncDisponible = false,
  surface = "dark",
}: Props) {
  const router = useRouter();
  const token = invitationAccessToken.trim();
  const esInvitacion = Boolean(token);
  const light = surface === "light";

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [results, setResults] = useState<ApiTrack[]>([]);
  const [items, setItems] = useState<MusicaListaItem[]>([]);
  const [puedeModerar, setPuedeModerar] = useState(false);
  const [sugerenciasUsadas, setSugerenciasUsadas] = useState<number | null>(null);
  const [sugerenciasMax, setSugerenciasMax] = useState(MUSICA_LIMITE_SUGERENCIAS_POR_PERSONA);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [listaErr, setListaErr] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [modoDj, setModoDj] = useState(false);
  const [modoFiestaActivo, setModoFiestaActivo] = useState(false);
  const [votandoId, setVotandoId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listaUrl = useCallback(() => {
    const p = new URLSearchParams({ evento_id: eventoId });
    if (token) p.set("invitacion_token", token);
    return `/api/musica/lista?${p.toString()}`;
  }, [eventoId, token]);

  const cargarLista = useCallback(async () => {
    if (!eventoId) return;
    try {
      const res = await fetch(listaUrl(), {
        credentials: esInvitacion ? "same-origin" : "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = (await res.json()) as {
        items?: MusicaListaItem[];
        puedeModerar?: boolean;
        message?: string;
        sugerencias_usadas?: number;
        sugerencias_max?: number;
        modo_fiesta_activo?: boolean;
      };
      if (!res.ok) {
        setListaErr(data.message ?? "No pudimos cargar la lista de sugerencias.");
        return;
      }
      setListaErr(null);
      const raw = data.items ?? [];
      setItems(
        raw.map((i) => ({
          ...i,
          votos: typeof i.votos === "number" ? i.votos : 0,
          ya_voto: Boolean(i.ya_voto),
          creado_en: i.creado_en ?? "",
        }))
      );
      setPuedeModerar(data.puedeModerar === true);
      setModoFiestaActivo(data.modo_fiesta_activo === true);
      if (typeof data.sugerencias_usadas === "number") setSugerenciasUsadas(data.sugerencias_usadas);
      if (typeof data.sugerencias_max === "number") setSugerenciasMax(data.sugerencias_max);
    } catch {
      setListaErr("No pudimos cargar la lista de sugerencias. Revisa tu conexión.");
    }
  }, [eventoId, esInvitacion, listaUrl]);

  useEffect(() => {
    if (!eventoId || !invitacionConfirmada) return;
    void cargarLista();
  }, [eventoId, invitacionConfirmada, cargarLista]);

  /** Invitación: la lista no se entera cuando los novios aprueban en el panel; refresco por foco, pestaña y tiempo. */
  useEffect(() => {
    if (!eventoId || !invitacionConfirmada) return;

    const tick = () => void cargarLista();

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    const onFocus = () => tick();
    const onPageShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) tick();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);

    const intervalId = esInvitacion ? window.setInterval(tick, 20000) : undefined;

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [eventoId, invitacionConfirmada, cargarLista, esInvitacion]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
          const data = (await res.json()) as { tracks?: ApiTrack[] };
          setResults(Array.isArray(data.tracks) ? data.tracks : []);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 380);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const limiteAlcanzado =
    sugerenciasUsadas !== null && sugerenciasUsadas >= sugerenciasMax;

  async function onAgregar(track: ApiTrack) {
    if (!eventoId || !invitacionConfirmada || limiteAlcanzado) return;
    const sid = spotifyTrackIdDesdeResultado(track);
    if (!sid) {
      setMsg({ type: "err", text: "No pudimos leer el ID de esta pista en Spotify. Prueba con otra búsqueda." });
      return;
    }
    setAdding(track.uri || sid);
    setMsg(null);
    try {
      const body: Record<string, string | undefined> = {
        evento_id: eventoId,
        spotify_id: sid,
        titulo: track.name,
        artista: track.artists,
        imagen: track.imageUrl ?? "",
      };
      if (token) body.invitacion_token = token;

      const res = await fetch("/api/musica/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: esInvitacion ? "same-origin" : "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; duplicado?: boolean; code?: string; message?: string };
      if (!res.ok || !data.ok) {
        if (data.code === "limite") {
          setMsg({ type: "err", text: "Ya agregaste tus canciones" });
          await cargarLista();
          return;
        }
        setMsg({ type: "err", text: data.message ?? "No se pudo enviar la canción. Intenta de nuevo." });
        return;
      }
      setMsg({
        type: "ok",
        text: data.duplicado
          ? "Esta canción ya está entre tus sugerencias (sección Pendientes). Si no la ves, desliza hacia abajo o actualiza la página."
          : "Canción enviada para aprobación",
      });
      await cargarLista();
      router.refresh();
    } catch {
      setMsg({ type: "err", text: "Error de red." });
    } finally {
      setAdding(null);
    }
  }

  async function onVotar(it: MusicaListaItem) {
    if (!eventoId || it.estado !== "aprobado" || it.ya_voto || votandoId) return;
    const prev = items;
    setItems((list) =>
      list.map((x) =>
        x.aporte_id === it.aporte_id ? { ...x, votos: x.votos + 1, ya_voto: true } : x
      )
    );
    setVotandoId(it.aporte_id);
    setMsg(null);
    try {
      const body: Record<string, string> = { evento_id: eventoId, aporte_id: it.aporte_id };
      if (token) body.invitacion_token = token;
      const res = await fetch("/api/musica/votar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: esInvitacion ? "same-origin" : "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; votos?: number; message?: string };
      if (!res.ok || !data.ok) {
        setItems(prev);
        setMsg({ type: "err", text: data.message ?? "No se pudo registrar el voto." });
        return;
      }
      await cargarLista();
      router.refresh();
    } catch {
      setItems(prev);
      setMsg({ type: "err", text: "Error de red." });
    } finally {
      setVotandoId(null);
    }
  }

  async function onEstado(aporteId: string, estado: "aprobado" | "rechazado") {
    setMsg(null);
    try {
      const res = await fetch("/api/musica/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ aporte_id: aporteId, evento_id: eventoId, estado }),
      });
      if (!res.ok) {
        setMsg({ type: "err", text: "No se pudo actualizar el estado." });
        return;
      }
      await cargarLista();
      router.refresh();
    } catch {
      setMsg({ type: "err", text: "Error de red." });
    }
  }

  async function onSync() {
    if (!eventoId || !puedeModerar || !spotifySyncDisponible) return;
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/spotify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ evento_id: eventoId }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setMsg({ type: "err", text: data.message ?? "No se pudo sincronizar con Spotify." });
        return;
      }
      setMsg({ type: "ok", text: "Playlist actualizada en Spotify." });
    } catch {
      setMsg({ type: "err", text: "Error de red." });
    } finally {
      setSyncing(false);
    }
  }

  const pendientes = items.filter((i) => i.estado === "pendiente");
  const aprobadas = items.filter((i) => i.estado === "aprobado");

  const listaDj = useMemo(
    () => [...aprobadas].sort((a, b) => b.votos - a.votos || a.creado_en.localeCompare(b.creado_en)),
    [aprobadas]
  );

  function exportarDjJson() {
    const payload = listaDj.map((r) => ({
      titulo: r.titulo,
      artista: r.artista,
      votos: r.votos,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lista-dj.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copiarListaDj() {
    const texto = listaDj.map((r) => `${r.titulo} — ${r.artista} (${r.votos} votos)`).join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setMsg({ type: "ok", text: "Lista copiada al portapapeles." });
    } catch {
      setMsg({ type: "err", text: "No se pudo copiar. Copia manualmente desde exportar." });
    }
  }

  const cardTitle = light ? "font-inviteSerif font-semibold text-invite-navy" : "font-display text-white";

  const btnVoteBase = light
    ? "rounded-full border px-2.5 py-1 text-[11px] font-semibold touch-manipulation"
    : "rounded-full border px-2.5 py-1 text-[11px] font-semibold touch-manipulation";
  const btnVoteActive = light
    ? "border-emerald-600/50 bg-emerald-50 text-emerald-900"
    : "border-[#1ed760]/60 bg-[#1ed760]/25 text-[#1ed760]";
  const btnVoteIdle = light
    ? "border-invite-navy/15 bg-white text-invite-navy hover:bg-invite-navy/5"
    : "border-white/15 bg-white/5 text-white hover:bg-white/10";

  return (
    <div
      className={
        light
          ? "rounded-2xl border border-invite-navy/10 bg-invite-sand/60 p-3 shadow-sm"
          : "mt-5 rounded-2xl border border-[#1ed760]/35 bg-gradient-to-b from-[#0d0d0d] via-[#121212] to-[#0a0a0a] p-4 shadow-[0_0_40px_-12px_rgba(30,215,96,0.35)]"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${light ? "bg-spotify-brand text-invite-navy" : "bg-spotify-brand text-black"}`}
          >
            ♫
          </span>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${cardTitle}`}>Música colaborativa</h2>
            <p className={`text-xs ${light ? "text-invite-navy/65" : "text-zinc-400"}`}>
              Solo canciones aprobadas se agregan a la playlist
            </p>
          </div>
        </div>
        {aprobadas.length > 0 ? (
          <button
            type="button"
            onClick={() => setModoDj((v) => !v)}
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${
              light ? "border-invite-navy/20 text-invite-navy" : "border-white/20 text-zinc-200"
            }`}
          >
            {modoDj ? "Salir del modo DJ" : "Modo DJ"}
          </button>
        ) : null}
      </div>

      {listaErr ? (
        <p className={`mt-3 text-sm ${light ? "text-red-700" : "text-red-300"}`} role="alert">
          {listaErr}
        </p>
      ) : null}

      {msg ? (
        <p
          className={`mt-3 text-sm ${msg.type === "ok" ? (light ? "text-emerald-700" : "text-[#1ed760]") : light ? "text-red-700" : "text-red-300"}`}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}

      {invitacionConfirmada && modoFiestaActivo && esInvitacion ? (
        <InvitacionMusicaFiestaEnVivo
          eventoId={eventoId}
          invitationAccessToken={invitationAccessToken}
          modoFiestaActivo={modoFiestaActivo}
          surface={surface}
        />
      ) : null}

      {!invitacionConfirmada ? (
        <p className={`mt-4 text-sm leading-relaxed ${light ? "text-invite-navy/75" : "text-zinc-400"}`}>
          Confirma tu asistencia para agregar canciones
        </p>
      ) : modoDj ? (
        <div className={`mt-4 space-y-3 ${light ? "border-t border-invite-navy/10 pt-4" : "border-t border-white/10 pt-4"}`}>
          <p className={`text-center text-sm font-semibold ${light ? "text-invite-navy" : "text-white"}`}>
            Lista lista para el DJ
          </p>
          {listaDj.length === 0 ? (
            <p className={`text-center text-sm ${light ? "text-invite-navy/65" : "text-zinc-500"}`}>
              Aún no hay canciones aprobadas.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {listaDj.map((it) => (
                  <li
                    key={it.aporte_id}
                    className={`rounded-xl border px-3 py-2 text-sm ${light ? "border-invite-navy/10 bg-white" : "border-white/10 bg-black/30"}`}
                  >
                    <p className={`font-medium ${light ? "text-invite-navy" : "text-white"}`}>{it.titulo}</p>
                    <p className={`text-xs ${light ? "text-invite-navy/65" : "text-zinc-400"}`}>{it.artista}</p>
                    <p className={`mt-1 text-xs ${light ? "text-invite-navy/55" : "text-zinc-500"}`}>{it.votos} votos</p>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => exportarDjJson()}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                    light ? "bg-invite-navy text-white" : "bg-white text-black"
                  }`}
                >
                  Exportar JSON
                </button>
                <button
                  type="button"
                  onClick={() => void copiarListaDj()}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                    light ? "border-invite-navy/25 text-invite-navy" : "border-white/20 text-zinc-200"
                  }`}
                >
                  Copiar lista
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <p className={`mt-3 text-center text-sm font-semibold ${light ? "text-invite-navy" : "text-white"}`}>
            Agrega tu canción 🎵
          </p>
          <p className={`mt-1 text-center text-[11px] ${light ? "text-invite-navy/55" : "text-zinc-500"}`}>
            {esInvitacion
              ? `Máximo ${sugerenciasMax} canciones por invitado`
              : `Máximo ${sugerenciasMax} canciones por miembro del evento`}
          </p>

          {limiteAlcanzado ? (
            <p className={`mt-3 text-center text-sm ${light ? "text-invite-navy/80" : "text-zinc-300"}`}>
              Ya agregaste tus canciones
            </p>
          ) : (
            <>
              <div className="mt-3 flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  placeholder="Buscar en Spotify…"
                  disabled={limiteAlcanzado}
                  className={
                    light
                      ? "min-w-0 flex-1 rounded-full border border-invite-navy/15 bg-white px-3 py-2 text-sm text-invite-navy placeholder:text-invite-navy/40 focus:border-[#1ed760]/50 focus:outline-none focus:ring-1 focus:ring-[#1ed760]/35 disabled:opacity-50"
                      : "min-w-0 flex-1 rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[#1ed760]/50 focus:outline-none focus:ring-1 focus:ring-[#1ed760]/40 disabled:opacity-50"
                  }
                />
                <span
                  className={`flex shrink-0 items-center rounded-full px-3 py-2 text-xs font-semibold ${light ? "bg-invite-navy/5 text-invite-navy/60" : "bg-white/5 text-zinc-500"}`}
                >
                  {loading ? "…" : "Buscar"}
                </span>
              </div>

              {results.length > 0 && (
                <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                  {results.map((t) => (
                    <li
                      key={t.uri}
                      className={`flex items-center gap-3 rounded-xl border p-2 ${
                        light ? "border-invite-navy/8 bg-white" : "border-white/5 bg-white/5"
                      }`}
                    >
                      <div
                        className={`h-12 w-12 shrink-0 overflow-hidden rounded-md ${light ? "bg-invite-navy/5" : "bg-zinc-800"}`}
                      >
                        {t.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center ${light ? "text-invite-navy/35" : "text-zinc-600"}`}
                          >
                            ♪
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${light ? "text-invite-navy" : "text-white"}`}>{t.name}</p>
                        <p className={`truncate text-xs ${light ? "text-invite-navy/65" : "text-zinc-400"}`}>{t.artists}</p>
                      </div>
                      <button
                        type="button"
                        disabled={limiteAlcanzado || adding === (t.uri || t.id)}
                        onClick={() => void onAgregar(t)}
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 sm:px-3 sm:text-xs ${
                          light
                            ? "border-[#15803d]/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border-[#1ed760]/50 bg-[#1ed760]/10 text-[#1ed760] hover:bg-[#1ed760]/20"
                        }`}
                      >
                        {adding === (t.uri || t.id) ? "…" : "Agregar"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className={`mt-6 space-y-5 ${light ? "border-t border-invite-navy/10 pt-4" : "border-t border-white/10 pt-4"}`}>
            {pendientes.length > 0 ? (
              <section aria-labelledby="musica-pendientes">
                <h3 id="musica-pendientes" className={`text-xs font-semibold uppercase tracking-widest ${light ? "text-invite-navy/45" : "text-zinc-500"}`}>
                  Pendientes
                </h3>
                {esInvitacion ? (
                  <p className={`mt-1 text-[10px] leading-snug ${light ? "text-invite-navy/45" : "text-zinc-500"}`}>
                    Cuando una canción pase a aprobada, podrás votarla 👍 en la sección siguiente. Esta lista se actualiza
                    sola cada pocos segundos o al volver a la pantalla.
                  </p>
                ) : null}
                <ul className="mt-2 space-y-2">
                  {pendientes.map((it) => (
                    <li
                      key={it.aporte_id}
                      className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        light ? "border-invite-navy/10 bg-white" : "border-white/10 bg-black/30"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-medium ${light ? "text-invite-navy" : "text-white"}`}>{it.titulo}</p>
                        <p className={`truncate text-xs ${light ? "text-invite-navy/60" : "text-zinc-400"}`}>{it.artista}</p>
                        <p className={`mt-0.5 text-[10px] ${light ? "text-invite-navy/45" : "text-zinc-500"}`}>{it.usuario}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          light ? "bg-amber-100 text-amber-900" : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        En revisión
                      </span>
                      {puedeModerar ? (
                        <span className="flex w-full gap-2 sm:w-auto sm:justify-end">
                          <button
                            type="button"
                            onClick={() => void onEstado(it.aporte_id, "aprobado")}
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              light ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-[#1ed760] text-black hover:brightness-110"
                            }`}
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => void onEstado(it.aporte_id, "rechazado")}
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                              light ? "border-invite-navy/20 text-invite-navy hover:bg-invite-navy/5" : "border-white/20 text-zinc-300 hover:bg-white/5"
                            }`}
                          >
                            Rechazar
                          </button>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {aprobadas.length > 0 ? (
              <section aria-labelledby="musica-aprobadas">
                <h3 id="musica-aprobadas" className={`text-xs font-semibold uppercase tracking-widest ${light ? "text-invite-navy/45" : "text-zinc-500"}`}>
                  Más votadas de la fiesta
                </h3>
                <p className={`mt-1 text-center text-[11px] ${light ? "text-invite-navy/55" : "text-zinc-500"}`}>
                  Vota tus favoritas 👍
                </p>
                <ul className="mt-2 space-y-2">
                  {aprobadas.map((it, idx) => (
                    <li
                      key={it.aporte_id}
                      className={`flex flex-wrap items-start gap-2 rounded-xl border px-3 py-2 sm:gap-3 ${
                        light ? "border-invite-navy/10 bg-white" : "border-white/10 bg-black/30"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 gap-2">
                        {idx < 3 ? (
                          <span
                            className={`shrink-0 pt-0.5 text-xs font-bold tabular-nums ${light ? "text-invite-gold" : "text-[#1ed760]"}`}
                            aria-hidden
                          >
                            #{idx + 1}
                          </span>
                        ) : (
                          <span className={`shrink-0 w-6 pt-0.5 text-center text-[10px] ${light ? "text-invite-navy/35" : "text-zinc-600"}`}>
                            {idx + 1}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium ${light ? "text-invite-navy" : "text-white"}`}>{it.titulo}</p>
                          <p className={`text-xs ${light ? "text-invite-navy/65" : "text-zinc-400"}`}>{it.artista}</p>
                          <p className={`mt-1 text-[10px] font-semibold ${light ? "text-emerald-700" : "text-[#1ed760]"}`}>Aprobada para la fiesta</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={it.ya_voto || votandoId === it.aporte_id}
                        onClick={() => void onVotar(it)}
                        className={`${btnVoteBase} shrink-0 ${it.ya_voto ? btnVoteActive : btnVoteIdle}`}
                        aria-pressed={it.ya_voto}
                      >
                        👍 {it.votos}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {puedeModerar && spotifySyncDisponible ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={syncing}
                onClick={() => void onSync()}
                className={`rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50 ${
                  light ? "bg-invite-navy text-white hover:brightness-110" : "bg-white text-black hover:brightness-95"
                }`}
              >
                {syncing ? "Sincronizando…" : "Sincronizar con Spotify"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
