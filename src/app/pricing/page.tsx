import { PricingPlansSection } from "@/components/pricing/PricingPlansSection";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Planes — Dreams",
  description:
    "Evento Esencial o Evento Experiencia. Pago único. Invitaciones boarding pass, RSVP, mesas y más.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <SiteHeader />
      <main>
        <PricingPlansSection />
        <section className="border-t border-white/10 bg-[#0a0f1a]/80 px-4 py-12 text-center">
          <p className="text-sm text-slate-500">
            ¿Necesitas ayuda para elegir?{" "}
            <Link href="/" className="font-medium text-[#D4AF37] hover:underline">
              Ver la invitación demo
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
