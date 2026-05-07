import { ModoDjCliente } from "@/components/panel/ModoDjCliente";
import { PanelBackLink } from "@/components/panel/PanelBackLink";
import { PanelLayout } from "@/components/panel/ds";
import { resolverPaginaModoDj } from "@/lib/panel-modo-dj-page";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Alias retrocompat; la ruta canónica es `/panel/viaje/[eventoId]/dj`. */
export default async function PanelModoDjAliasPage({ params }: { params: { id: string } }) {
  const r = await resolverPaginaModoDj(params.id ?? "");
  if (!r.ok) {
    redirect(r.redirect);
  }

  return (
    <PanelLayout narrow>
      <PanelBackLink />
      <ModoDjCliente eventoId={r.eventoId} mostrarControlesAdmin />
    </PanelLayout>
  );
}
