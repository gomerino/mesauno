import { redirect } from "next/navigation";

/** Alias sugerido → misma experiencia que `/panel/success`. */
export default function PanelPostPagoRedirectPage() {
  redirect("/panel/success");
}
