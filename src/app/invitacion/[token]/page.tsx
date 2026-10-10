import { InvitacionViewTracker } from "@/components/InvitacionViewTracker";
import { EditorialPremiumTheme } from "@/components/themes/editorial-premium/EditorialPremiumTheme";
import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import { EditorialDevelopmentPreview } from "@/components/themes/editorial-premium/EditorialDevelopmentPreview";
import { createClient, createStrictServiceClient } from "@/lib/supabase/server";
import { loadInvitacionSeoByToken } from "@/lib/invitacion-seo.server";
import { InvitacionSemanticaSrOnly } from "@/components/invitacion/InvitacionSemanticaSrOnly";
import { LegacyTheme } from "@/components/themes/LegacyTheme";
import { JurnexAviationTheme } from "@/components/themes/JurnexAviationTheme";
import { SoftAviationTheme } from "@/components/themes/SoftAviationTheme";
import type { InvitacionThemePageProps } from "@/components/themes/invitacion-theme-props";
import {
  boardingPassQrMapUrlMerged,
  fetchEventoForInvitado,
  mergeEventoParaPase,
} from "@/lib/evento-boarding";
import { isEditorialDevelopmentPreview, resolveInvitacionThemeId } from "@/lib/invitacion-theme";
import { resolveEventPlaylistEnv } from "@/lib/event-playlist-env";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import {
  hubHitosToProgramaHitos,
  parseProgramaConFotosVentanasPublica,
  programaFotosPorHitoFromHub,
  type ProgramaHitoFotoPublic,
} from "@/lib/programa-con-fotos-publica";
import {
  playlistInvitadoApoyoUris,
  playlistListRecentPublic,
  playlistListTopPublic,
  spotifyGetCredentials,
} from "@/lib/spotify-credentials";
import type { EventoFoto, EventoProgramaHito, Invitado, ConfiguracionRegalosPublica } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const REGALOS_DEFAULT: ConfiguracionRegalosPublica = {
  regalos_activos: false,
  url_regalos: null,
  texto_regalos: null,
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ theme?: string; phase?: string; boarding?: string; cover?: string; contracts?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  if (token === "editorial-preview") {
    return { title: "Editorial Premium · Preview", robots: { index: false, follow: false } };
  }
  const seo = await loadInvitacionSeoByToken(token);
  if (!seo.ok) {
    return { title: "Invitación" };
  }
  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.pageUrl,
      siteName: "Jurnex",
      type: "website",
      images: [
        { url: seo.ogImage, width: 1024, height: 1024, alt: "Jurnex" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.ogImage],
    },
  };
}

export default async function InvitacionPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { theme: themeQuery, phase, boarding, cover, contracts } = await searchParams;
  if (token === "editorial-preview") {
    if (!isEditorialDevelopmentPreview(token, themeQuery, process.env.NODE_ENV)) notFound();
    return <EditorialDevelopmentPreview phase={phase} boarding={boarding} contracts={contracts === "1"} />;
  }
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
  let programaFotosPorHito: Record<string, ProgramaHitoFotoPublic[]> = {};

  const { data: hubRaw, error: hubErr } = await supabase.rpc("programa_con_fotos_ventanas_publica", {
    p_token: token,
  });
  const hub = !hubErr ? parseProgramaConFotosVentanasPublica(hubRaw) : null;

  if (hub && hub.hitos.length > 0) {
    programaHitos = hubHitosToProgramaHitos(hub);
    programaFotosPorHito = programaFotosPorHitoFromHub(hub);
  } else {
    const { data: programaRaw, error: programaErr } = await supabase.rpc("programa_evento_lista_publica", {
      p_token: token,
    });
    if (!programaErr && Array.isArray(programaRaw)) {
      programaHitos = programaRaw as EventoProgramaHito[];
    }
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
  let topTracks: Awaited<ReturnType<typeof playlistListTopPublic>> = [];
  let apoyoTrackUris: string[] = [];
  if (invitado.evento_id) {
    const db = await createStrictServiceClient();
    if (db) {
      const creds = await spotifyGetCredentials(db, invitado.evento_id);
      musicColabEnabled = Boolean(creds?.refresh_token && creds.playlist_id);
      if (musicColabEnabled) {
        recentTracks = await playlistListRecentPublic(db, invitado.evento_id, 5);
        topTracks = await playlistListTopPublic(db, invitado.evento_id, 8);
        const uris = await playlistInvitadoApoyoUris(db, invitado.evento_id, invitado.id);
        apoyoTrackUris = Array.from(uris);
      }
    }
  }

  let regalos: ConfiguracionRegalosPublica = REGALOS_DEFAULT;
  {
    const { data: regalosRaw, error: regalosErr } = await supabase.rpc("configuracion_regalos_publica", {
      p_token: token,
    });
    if (!regalosErr && Array.isArray(regalosRaw) && regalosRaw[0]) {
      const row = regalosRaw[0] as ConfiguracionRegalosPublica;
      regalos = {
        regalos_activos: Boolean(row.regalos_activos),
        url_regalos: row.url_regalos ?? null,
        texto_regalos: row.texto_regalos ?? null,
      };
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
    programaFotosPorHito,
    albumFotos,
    musicColabEnabled,
    recentTracks,
    topTracks,
    apoyoTrackUris,
    regalos,
  };

  const themeId = resolveInvitacionThemeId({ evento, invitado }, themeQuery);

  if (themeId === "editorial-premium") {
    const selectedCover = albumFotos.find((foto) => foto.id === cover && foto.evento_id === invitado.evento_id);
    return (
      <>
        <InvitacionViewTracker accessToken={token} />
        <EditorialPremiumTheme {...themeProps} config={{
          phase: process.env.NODE_ENV === "development" && (phase === "antes" || phase === "durante" || phase === "despues") ? phase : undefined,
          showBoardingPass: boarding !== "0",
          cover: selectedCover ? { src: eventoFotoPublicUrl(selectedCover.storage_path), alt: "Fotografía elegida del evento" } : undefined,
        }} />
        <InvitacionSemanticaSrOnly />
      </>
    );
  }

  if (themeId === "jurnex-aviation") {
    return (
      <>
        <JurnexAviationTheme {...themeProps} />
        <InvitacionSemanticaSrOnly />
      </>
    );
  }

  if (themeId === "soft-aviation") {
    return (
      <>
        <SoftAviationTheme {...themeProps} />
        <InvitacionSemanticaSrOnly />
      </>
    );
  }

  return (
    <>
      <LegacyTheme {...themeProps} />
      <InvitacionSemanticaSrOnly />
    </>
  );
}
