import { fetchEventoForInvitado, mergeEventoParaPase } from "@/lib/evento-boarding";
import { epigrafeDesdeMotivo } from "@/lib/invitacion-epigrafe";
import { fetchInvitadoWithAcompanantes } from "@/lib/invitado-fetch";
import { createClient } from "@/lib/supabase/server";
import { ensureAbsoluteSiteOrigin, getCanonicalSiteOriginFromEnv } from "@/lib/public-origin";
import type { Invitado } from "@/types/database";

/**
 * Título, descripción y URL absoluta para compartir / `generateMetadata` en `/invitacion/[token]`.
 */
export async function loadInvitacionSeoByToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await fetchInvitadoWithAcompanantes(supabase, token);
  if (error || !data) return { ok: false as const };

  const invitado = data as Invitado;
  const evento = await fetchEventoForInvitado(supabase, invitado, { invitacionToken: token });
  const merged = mergeEventoParaPase(invitado, evento);

  const tituloNovios =
    merged.footerNovios ||
    [evento?.nombre_novio_1, evento?.nombre_novio_2].filter(Boolean).join(" & ") ||
    "Nuestra celebración";
  const epigrafe = epigrafeDesdeMotivo(merged.motivo_viaje, 160);
  const defaultDesc = "Recibí tu pase y confirma tu asistencia en Jurnex.";
  const description = epigrafe ? `${epigrafe} — ${defaultDesc}` : `Invitación — ${tituloNovios}. ${defaultDesc}`;

  const origin = ensureAbsoluteSiteOrigin(getCanonicalSiteOriginFromEnv() ?? "http://localhost:3000");
  const pageUrl = `${origin}/invitacion/${encodeURIComponent(token)}`;
  const ogImage = `${origin}/brand/jurnex/logos/full/jurnex-logo-full.png`;

  return {
    ok: true as const,
    title: `Invitación — ${tituloNovios}`,
    description,
    pageUrl,
    ogImage,
  };
}
