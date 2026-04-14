import { redirect } from "next/navigation";

type SearchParams = Promise<{ id?: string }>;

/** @deprecated Usa /panel/invitados/vista */
export default async function PanelVistaInvitacionRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;
  const q = id ? `?id=${encodeURIComponent(id)}` : "";
  redirect(`/panel/invitados/vista${q}`);
}
