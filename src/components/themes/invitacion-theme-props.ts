import type { MergedEventoParaPase } from "@/lib/evento-boarding";
import type { EventPlaylistUrls } from "@/lib/event-playlist-env";
import type { PlaylistAportePublic, PlaylistTopPublic } from "@/lib/spotify-credentials";
import type { ProgramaHitoFotoPublic } from "@/lib/programa-con-fotos-publica";
import type { Evento, EventoFoto, EventoProgramaHito, Invitado } from "@/types/database";

export type InvitacionThemePageProps = {
  token: string;
  invitado: Invitado;
  evento: Evento | null;
  merged: MergedEventoParaPase;
  qrValue: string;
  playlists: EventPlaylistUrls;
  programaHitos: EventoProgramaHito[];
  /** Fotos del álbum asociadas a cada momento del programa (lectura pública). Vacío si no aplica. */
  programaFotosPorHito: Record<string, ProgramaHitoFotoPublic[]>;
  albumFotos: EventoFoto[];
  musicColabEnabled: boolean;
  recentTracks: PlaylistAportePublic[];
  topTracks: PlaylistTopPublic[];
  /** URIs que este invitado ya apoyó (`playlist_apoyos`). */
  apoyoTrackUris: string[];
};
