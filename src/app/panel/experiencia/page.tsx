import { redirect } from "next/navigation";

/** La experiencia vive en Viaje (pestaña Experiencia). */
export default function ExperienciaRedirectPage() {
  redirect("/panel/viaje");
}
