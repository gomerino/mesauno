import { redirect } from "next/navigation";

/** Compatibilidad: el inicio del journey vive en `/panel`. */
export default function PanelOverviewRedirectPage() {
  redirect("/panel");
}
