import { CTA } from "@/components/marketing/CTA";
import { DemoPreview } from "@/components/marketing/DemoPreview";
import { Features } from "@/components/marketing/Features";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { LandingMidCta } from "@/components/marketing/LandingMidCta";
import { LandingSocialProof } from "@/components/marketing/LandingSocialProof";
import { LandingStickyCta } from "@/components/marketing/LandingStickyCta";
import { SiteHeader } from "@/components/SiteHeader";
import { DEMO_URL } from "@/lib/demo-invitation-public-url";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dreams — Invitaciones boarding pass para tu evento",
  description:
    "Invita, organiza y comparte bodas, cumpleaños y eventos corporativos. Invitación digital, RSVP, mesas y check-in QR en un solo lugar.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-jurnex-bg pb-[5.5rem] md:pb-0">
      <SiteHeader />
      <Hero />
      <div className="border-b border-jurnex-border bg-jurnex-surface/50">
        <LandingSocialProof />
      </div>
      <Features />
      <DemoPreview />
      <LandingMidCta />
      <HowItWorks />
      <CTA />
      <footer className="border-t border-jurnex-border bg-jurnex-bg px-4 py-10 text-center text-xs text-jurnex-text-muted">
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/marketplace" className="hover:text-slate-300">
            Marketplace
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/login" className="hover:text-slate-300">
            Panel novios
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/invitacion/demo" className="hover:text-slate-300">
            Demo local
          </Link>
          <span className="text-slate-700">·</span>
          <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">
            Invitación real
          </a>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Dreams Wedding</p>
      </footer>
      <LandingStickyCta />
    </div>
  );
}
