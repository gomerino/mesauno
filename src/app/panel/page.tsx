import { redirect } from "next/navigation";

/** Entrada unificada del panel: siempre el resumen. */
export default function PanelIndexPage() {
  redirect("/panel/overview");
}
