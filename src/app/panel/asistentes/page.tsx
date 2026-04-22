import { redirect } from "next/navigation";

/** @deprecated Usa /panel/pasajeros/confirmaciones */
export default function PanelAsistentesRedirect() {
  redirect("/panel/pasajeros/confirmaciones");
}
