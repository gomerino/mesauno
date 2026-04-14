import { redirect } from "next/navigation";

/** @deprecated Usa /panel/invitados/confirmaciones */
export default function PanelAsistentesRedirect() {
  redirect("/panel/invitados/confirmaciones");
}
