import { redirect } from "next/navigation";

/** @deprecated Usa /panel/finanzas */
export default function PanelRegalosRedirect() {
  redirect("/panel/finanzas");
}
