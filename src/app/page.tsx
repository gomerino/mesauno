import { CTA } from "@/components/marketing/CTA";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { InvitacionShowcase } from "@/components/marketing/InvitacionShowcase";
import {
  LandingAntesConJurnex,
  LandingDemoFlujo,
  LandingDiferencial,
} from "@/components/marketing/LandingConversion";
import { LandingMidCta } from "@/components/marketing/LandingMidCta";
import { LandingSocialProof } from "@/components/marketing/LandingSocialProof";
import { LandingStickyCta } from "@/components/marketing/LandingStickyCta";
import { SiteHeader } from "@/components/SiteHeader";
import { DEMO_URL, tieneUrlInvitacionDemo } from "@/lib/demo-invitation-public-url";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jurnex — Crea tu viaje de bodas",
  description:
    "Panel de novios e invitación estilo pase de abordaje, con RSVP, invitados, programa y recuerdos en un solo flujo premium desde la primera visita.",
};

export default function HomePage() {
  return (
    <div className="jurnex-brand-layers min-h-screen bg-jurnex-bg pb-[5.5rem] md:pb-0">
      <SiteHeader />
      <Hero />
      <div className="border-b border-white/[0.08] bg-white/[0.06]">
        <LandingSocialProof />
      </div>
      <HowItWorks />
      <LandingDemoFlujo />
      <LandingDiferencial />
      <LandingAntesConJurnex />
      <InvitacionShowcase />
      <LandingMidCta />
      <CTA />
      <footer className="border-t border-white/12 bg-jurnex-bg px-4 py-10 text-center text-xs text-jurnex-text-primary/88">
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium">
          <Link href="/login" className="text-teal-100 underline-offset-2 hover:text-white hover:underline">
            Panel novios
          </Link>
          {tieneUrlInvitacionDemo() ? (
            <>
              <span className="text-teal-200/75" aria-hidden>
                ·
              </span>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-100 underline-offset-2 hover:text-white hover:underline"
              >
                Ejemplo de invitación
              </a>
            </>
          ) : null}
        </div>
        <p className="mt-4 text-jurnex-text-secondary">© {new Date().getFullYear()} Jurnex</p>
      </footer>
      <LandingStickyCta />
    </div>
  );
}
