import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { LegacyTheme } from "@/components/themes/LegacyTheme";
import { SoftAviationTheme } from "@/components/themes/SoftAviationTheme";
import type { InvitacionThemePageProps } from "@/components/themes/invitacion-theme-props";
import {
  boardingPassQrMapUrlMerged,
  fetchEventoForInvitado,
  mergeEventoParaPase,
} from "@/lib/evento-boarding";
import { resolveInvitacionThemeId } from "@/lib/invitacion-theme";
import { resolveEventPlaylistEnv } from "@/lib/event-playlist-env";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import { playlistListRecentPublic, spotifyGetCredentials } from "@/lib/spotify-credentials";
import type { EventoFoto, EventoProgramaHito, Invitado } from "@/types/database";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ theme?: string }>;
};

export const dynamic = "force-dynamic";

export default async function InvitacionPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { theme: themeQuery } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await fetchInvitadoWithAcompanantes(supabase, token);

  if (error || !data) {
    notFound();
  }

  const invitado = data as Invitado;
  const evento = await fetchEventoForInvitado(supabase, invitado, { invitacionToken: token });
  const qrValue = boardingPassQrMapUrlMerged(invitado, evento);
  const merged = mergeEventoParaPase(invitado, evento);
  const playlists = resolveEventPlaylistEnv();

  let programaHitos: EventoProgramaHito[] = [];
  const { data: programaRaw, error: programaErr } = await supabase.rpc("programa_evento_lista_publica", {
    p_token: token,
  });
  if (!programaErr && Array.isArray(programaRaw)) {
    programaHitos = programaRaw as EventoProgramaHito[];
  }

  let albumFotos: EventoFoto[] = [];
  if (invitado.evento_id) {
    const { data: fotosRaw, error: fotosErr } = await supabase.rpc("fotos_evento_lista_publica", {
      p_token: token,
    });
    if (!fotosErr && Array.isArray(fotosRaw)) {
      albumFotos = fotosRaw as EventoFoto[];
    }
  }

  let musicColabEnabled = false;
  let recentTracks: Awaited<ReturnType<typeof playlistListRecentPublic>> = [];
  if (invitado.evento_id) {
    const db = await createStrictServiceClient();
    if (db) {
      const creds = await spotifyGetCredentials(db, invitado.evento_id);
      musicColabEnabled = Boolean(creds?.refresh_token && creds.playlist_id);
      if (musicColabEnabled) {
        recentTracks = await playlistListRecentPublic(db, invitado.evento_id, 5);
      }
    }
  }

  const themeProps: InvitacionThemePageProps = {
    token,
    invitado,
    evento,
    merged,
    qrValue,
    playlists,
    programaHitos,
    albumFotos,
    musicColabEnabled,
    recentTracks,
  };

  const themeId = resolveInvitacionThemeId(invitado, themeQuery);

  if (themeId === "soft-aviation") {
    return <SoftAviationTheme {...themeProps} />;
  }

  return <LegacyTheme {...themeProps} />;
}
