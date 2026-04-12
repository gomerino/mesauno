import { CTA } from "@/components/marketing/CTA";
import { DemoPreview } from "@/components/marketing/DemoPreview";
import { Features } from "@/components/marketing/Features";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dreams Wedding — Invitaciones boarding pass",
  description:
    "Invitación digital, organización de invitados, RSVP y check-in QR. Tu matrimonio, como un boarding pass.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <SiteHeader />
      <Hero />
      <Features />
      <DemoPreview />
      <HowItWorks />
      <CTA />
      <footer className="border-t border-white/10 bg-[#020617] px-4 py-10 text-center text-xs text-slate-500">
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
            Demo invitación
          </Link>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Dreams Wedding</p>
      </footer>
    </div>
  );
}
