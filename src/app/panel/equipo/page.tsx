import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { PanelSubpageChrome } from "@/components/panel/PanelSubpageChrome";
import { EquipoPageClient } from "@/components/dashboard/EquipoPageClient";
import { formatEventTitle } from "@/lib/couple-event-title";
import { requirePanelScopedEventoId } from "@/lib/panel-evento-scope";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type MiembroRow = {
  user_id: string;
  email: string;
  rol: string;
  created_at: string | null;
};

function parseList(data: unknown): MiembroRow[] {
  if (Array.isArray(data)) return data as MiembroRow[];
  if (typeof data === "string") {
    try {
      const p = JSON.parse(data) as unknown;
      return Array.isArray(p) ? (p as MiembroRow[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default async function PanelEquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const scope = await requirePanelScopedEventoId(supabase, user!.id);
  if (!scope.ok) {
    redirect(scope.redirect);
  }
  const evento_id = scope.eventoId;

  const { data: rawList, error: listErr } = await supabase.rpc("evento_equipo_list", {
    p_evento_id: evento_id,
  });

  const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", {
    p_evento_id: evento_id,
  });

  const { data: evento } = await supabase
    .from("eventos")
    .select("nombre_novio_1, nombre_novio_2, nombre_evento")
    .eq("id", evento_id)
    .maybeSingle();

  const miembros = listErr ? [] : parseList(rawList);
  const titulo = formatEventTitle(evento);

  return (
    <PanelSubpageChrome>
      <CouplePageHeader
        eyebrow="Equipo"
        title="¿Quién organiza contigo?"
        subtitle={
          <>
            Invita a tu pareja o a quien te ayude con la logística del evento{" "}
            <span className="font-medium text-slate-200">{titulo}</span>. Cada persona tendrá permisos según el rol que
            elijas.
          </>
        }
      />

      {listErr && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          No pudimos cargar el equipo. Si persiste, contacta soporte e indica este mensaje: {listErr.message}
        </p>
      )}

      <EquipoPageClient
        eventoId={evento_id}
        initialMiembros={miembros}
        isAdmin={Boolean(isAdmin)}
      />
    </PanelSubpageChrome>
  );
}
