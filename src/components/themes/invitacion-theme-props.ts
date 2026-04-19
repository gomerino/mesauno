import type { MergedEventoParaPase } from "@/lib/evento-boarding";
import type { EventPlaylistUrls } from "@/lib/event-playlist-env";
import type { PlaylistAportePublic, PlaylistTopPublic } from "@/lib/spotify-credentials";
import type { Evento, EventoFoto, EventoProgramaHito, Invitado } from "@/types/database";

export type InvitacionThemePageProps = {
  token: string;
  invitado: Invitado;
  evento: Evento | null;
  merged: MergedEventoParaPase;
  qrValue: string;
  playlists: EventPlaylistUrls;
  programaHitos: EventoProgramaHito[];
  albumFotos: EventoFoto[];
  musicColabEnabled: boolean;
  recentTracks: PlaylistAportePublic[];
  topTracks: PlaylistTopPublic[];
  /** URIs que este invitado ya apoyó (`playlist_apoyos`). */
  apoyoTrackUris: string[];
};
