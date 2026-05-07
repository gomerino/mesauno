import { musicaUsuarioEsAdminEvento } from "@/lib/musica-colaborativa";
import { requirePanelScopedEventoId } from "@/lib/panel-evento-scope";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const DJ_PANEL_PATH = "/panel/viaje";

export async function resolverPaginaModoDj(eventoIdDesdeRuta: string): Promise<
  | { ok: true; eventoId: string }
  | { ok: false; redirect: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { ok: false, redirect: "/login" };
  }

  const scope = await requirePanelScopedEventoId(supabase, user.id);
  if (!scope.ok) {
    return { ok: false, redirect: scope.redirect };
  }

  const param = eventoIdDesdeRuta.trim();
  if (param !== scope.eventoId) {
    return { ok: false, redirect: `${DJ_PANEL_PATH}/${scope.eventoId}/dj` };
  }

  const db = await createServiceClient();
  const admin = await musicaUsuarioEsAdminEvento(db, user.id, scope.eventoId);
  if (!admin) {
    return { ok: false, redirect: "/panel" };
  }

  return { ok: true, eventoId: scope.eventoId };
}
