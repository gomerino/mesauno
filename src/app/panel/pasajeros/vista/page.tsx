import { EmptyStateCard } from "@/components/app/EmptyStateCard";
import { PanelBackLink } from "@/components/panel/PanelBackLink";
import { PanelPageContainer } from "@/components/panel/PanelPageContainer";
import { PanelPageHeader } from "@/components/panel/PanelPageHeader";
import { PanelSubpageProgress } from "@/components/panel/PanelSubpageProgress";
import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { InvitadoPicker } from "@/components/panel/InvitadoPicker";
import { InvitacionShareActions } from "@/components/panel/InvitacionShareActions";
import { InvitacionFullPreview } from "@/components/panel/InvitacionFullPreview";
import { resolveInvitationToken } from "@/lib/invitation-url";
import { resolveInvitacionThemeId } from "@/lib/invitacion-theme";
import { fetchInvitadosPanelRowsWithAcompanantes } from "@/lib/panel-invitados";
import type { Invitado, Evento } from "@/types/database";

type SearchParams = Promise<{ id?: string }>;

export default async function PanelInvitadosVistaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id: qId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "*");
  const eventoRow = (evento ?? null) as Evento | null;

  const { data: rows } = await fetchInvitadosPanelRowsWithAcompanantes(
    supabase,
    user!.id,
    eventoRow?.id ?? null,
    { orderBy: "nombre_pasajero", ascending: true }
  );

  const list = (rows ?? []) as unknown as Invitado[];

  if (list.length === 0) {
    return (
      <PanelPageContainer>
        <PanelBackLink />
        <PanelPageHeader
          eyebrow="Compartir"
          title="Vista previa"
          subtitle="Así verá cada invitado su invitación. Agregá al menos una persona en Invitados para previsualizarla."
        />
        <PanelSubpageProgress />
        <div className="mt-6">
          <EmptyStateCard
            title="Todavía no hay invitados"
            description="Cuando des de alta a alguien, vas a poder ver acá la invitación tal como la recibirá."
            actionHref="/panel/pasajeros"
            actionLabel="Ir a Invitados"
          />
        </div>
      </PanelPageContainer>
    );
  }

  const defaultId = qId && list.some((i) => i.id === qId) ? qId : list[0]!.id;
  const invitado = list.find((i) => i.id === defaultId) ?? list[0]!;

  const tokenAcceso = resolveInvitationToken({
    token_acceso: invitado.token_acceso ?? null,
    id: invitado.id,
  });
  const themeId = resolveInvitacionThemeId({ evento: eventoRow, invitado }, null);

  return (
    <PanelPageContainer>
      <PanelBackLink />
      <PanelPageHeader
        eyebrow="Compartir"
        title="Vista previa"
        subtitle="Así verá la invitación tu invitado. El estilo se configura desde los datos del evento."
      />

      <PanelSubpageProgress />

      <div className="mt-6">
        <InvitadoPicker
          invitados={list.map((i) => ({ id: i.id, nombre: i.nombre_pasajero }))}
          currentId={defaultId}
        />
      </div>

      <div className="mt-6 flex justify-center">
        <InvitacionShareActions
          tokenAcceso={tokenAcceso}
          invitadoId={invitado.id}
          invitadoNombre={invitado.nombre_pasajero}
          source="vista_previa"
        />
      </div>

      <div className="mt-8 flex justify-center">
        <InvitacionFullPreview
          tokenAcceso={tokenAcceso}
          invitadoId={invitado.id}
          invitadoNombre={invitado.nombre_pasajero}
          previewThemeId={themeId}
        />
      </div>
    </PanelPageContainer>
  );
}
