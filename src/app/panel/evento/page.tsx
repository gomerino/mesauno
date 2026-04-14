import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { PanelSubpageChrome } from "@/components/panel/PanelSubpageChrome";
import { RecordatoriosEventoSection } from "@/components/panel/RecordatoriosEventoSection";
import { SpotifyPlaylistConnect } from "@/components/panel/SpotifyPlaylistConnect";
import { EventoForm } from "@/components/panel/EventoForm";
import { selectEventoForMember } from "@/lib/evento-membership";
import { isEventBasicsComplete } from "@/lib/panel-setup-progress";
import { spotifyGetCredentials } from "@/lib/spotify-credentials";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import type { Evento } from "@/types/database";
import Link from "next/link";
import { Suspense } from "react";

function pickWelcome(raw: Record<string, string | string[] | undefined> | undefined): boolean {
  if (!raw) return false;
  const v = raw.welcome;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  return s === "1" || s === "true";
}

export default async function PanelEventoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const showWelcomeBanner = pickWelcome(searchParams);

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

  const eventoForProgress = (evento ?? null) as Evento | null;
  const basicsDone = isEventBasicsComplete(eventoForProgress);

  return (
    <PanelSubpageChrome>
      {showWelcomeBanner && (
        <div
          className="mb-6 rounded-xl border border-teal-500/35 bg-teal-500/10 px-4 py-3 text-sm text-teal-50 shadow-[0_0_0_1px_rgba(20,184,166,0.15)]"
          role="status"
        >
          <strong className="font-semibold text-white">¡Bienvenidos!</strong> Completa los datos de abajo, añade
          invitados y comparte el enlace desde el menú cuando estés listos.
        </div>
      )}
      <CouplePageHeader
        eyebrow="Tu evento"
        title="Datos e invitación"
        subtitle={
          <>
            Configura nombre, fecha y el aspecto de la invitación una sola vez. Puedes invitar a tu pareja a gestionar
            lo mismo desde su cuenta. La lista de invitados la cargas en{" "}
            <Link href="/panel/invitados" className="text-teal-300 underline hover:text-teal-200">
              Invitados
            </Link>
            .
            {eventoId ? (
              <>
                {" "}
                El <strong className="font-medium text-slate-300">programa del día</strong> (horarios y momentos) lo
                editas en{" "}
                <Link
                  href="/panel/programa"
                  className="text-teal-300 underline decoration-teal-500/50 underline-offset-2 hover:text-teal-200"
                >
                  Programa del día
                </Link>
                .
              </>
            ) : null}
          </>
        }
      />

      {!basicsDone && (
        <div className="mt-6 rounded-xl border border-teal-500/30 bg-teal-500/[0.12] px-4 py-3 text-sm text-teal-50" role="status">
          <strong className="font-medium text-white">Te falta un poco:</strong> completa nombre de ambos y la fecha en
          el formulario de abajo para que la invitación quede lista.
        </div>
      )}

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
                Programa del día
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
                Monta la línea de tiempo (ceremonia, cóctel, fiesta…). Los invitados la ven en la invitación, con
                horarios y mapas si los agregas.
              </p>
            </div>
            <Link
              href="/panel/programa"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Editar programa
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
            Guarda los datos del evento al menos una vez para conectar la música en la invitación.
          </p>
        )}
      </div>
    </PanelSubpageChrome>
  );
}
