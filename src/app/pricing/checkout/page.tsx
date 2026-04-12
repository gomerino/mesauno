import { redirect } from "next/navigation";

/** Flujo antiguo: el checkout pasa por modal + API + Mercado Pago. */
export default function LegacyPricingCheckoutPage() {
  redirect("/pricing");
}
