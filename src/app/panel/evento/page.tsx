import { RecordatoriosEventoSection } from "@/components/panel/RecordatoriosEventoSection";
import { SpotifyPlaylistConnect } from "@/components/panel/SpotifyPlaylistConnect";
import { EventoForm } from "@/components/panel/EventoForm";
import { selectEventoForMember } from "@/lib/evento-membership";
import { spotifyGetCredentials } from "@/lib/spotify-credentials";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import type { Evento } from "@/types/database";
import Link from "next/link";
import { Suspense } from "react";

export default async function PanelEventoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "*");

  const eventoId = (evento as { id?: string } | null)?.id ?? null;
  let spotifyConnected = false;
  let playlistId: string | null = null;
  if (eventoId) {
    const db = await createStrictServiceClient();
    if (db) {
      const creds = await spotifyGetCredentials(db, eventoId);
      spotifyConnected = Boolean(creds?.refresh_token);
      playlistId = creds?.playlist_id ?? null;
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Evento</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        Configura los datos del evento y del boarding pass una sola vez. Varios usuarios pueden gestionar el mismo
        evento (tabla <code className="text-teal-300">evento_miembros</code>). Los invitados en{" "}
        <Link href="/panel/invitados" className="text-teal-300 underline hover:text-teal-200">
          Crear invitados
        </Link>
        .
        {eventoId ? (
          <>
            {" "}
            El <strong className="font-medium text-slate-300">cronograma</strong> del día lo editas en{" "}
            <Link
              href={`/dashboard/${eventoId}/programa`}
              className="text-teal-300 underline decoration-teal-500/50 underline-offset-2 hover:text-teal-200"
            >
              Programa del evento
            </Link>
            .
          </>
        ) : null}
      </p>

      <div className="mt-10">
        <EventoForm initial={(evento ?? null) as Evento | null} />
      </div>

      {eventoId ? (
        <section
          className="mt-10 rounded-2xl border border-teal-500/25 bg-gradient-to-br from-teal-500/[0.08] to-white/[0.02] p-5 shadow-[0_0_0_1px_rgba(20,184,166,0.06)]"
          aria-labelledby="programa-evento-heading"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h2 id="programa-evento-heading" className="font-display text-lg font-semibold text-white">
                Programa del evento
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
                Arma la línea de tiempo del día (ceremonia, coctel, fiesta…). Los invitados la ven en su invitación,
                con horarios y enlaces a mapas si los agregas.
              </p>
            </div>
            <Link
              href={`/dashboard/${eventoId}/programa`}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Editar cronograma
            </Link>
          </div>
        </section>
      ) : null}

      {eventoId && (
        <div className="mt-10">
          <RecordatoriosEventoSection
            eventoId={eventoId}
            initial={{
              recordatorios_activos: Boolean((evento as Evento | null)?.recordatorios_activos),
              max_recordatorios: (evento as Evento | null)?.max_recordatorios ?? 2,
              frecuencia_recordatorios: (evento as Evento | null)?.frecuencia_recordatorios ?? 3,
              fecha_inicio_recordatorios: (evento as Evento | null)?.fecha_inicio_recordatorios ?? null,
            }}
          />
        </div>
      )}

      <div className="mt-12">
        {eventoId ? (
          <Suspense
            fallback={<div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" aria-hidden />}
          >
            <SpotifyPlaylistConnect
              eventoId={eventoId}
              spotifyConnected={spotifyConnected}
              initialPlaylistId={playlistId}
            />
          </Suspense>
        ) : (
          <p className="text-sm text-slate-500">
            Guarda los datos del evento al menos una vez para configurar la playlist de Spotify.
          </p>
        )}
      </div>
    </>
  );
}
