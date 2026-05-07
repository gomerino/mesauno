import { Hero } from "@/components/marketing/Hero";
import { LandingStickyCta } from "@/components/marketing/LandingStickyCta";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Jurnex — Organiza tu matrimonio sin caos",
  description: "Invitaciones, invitados y experiencia en un solo lugar",
  openGraph: {
    title: "Jurnex",
    description: "Organiza tu matrimonio sin caos",
    url: "/",
    siteName: "Jurnex",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jurnex — tu boda, tu viaje",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jurnex",
    description: "Organiza tu matrimonio sin caos",
    images: ["/og-image.png"],
  },
};

const HowItWorksLazy = nextDynamic(
  () => import("@/components/marketing/HowItWorks").then((m) => ({ default: m.HowItWorks })),
  {
    loading: () => <section className="min-h-[14rem] border-b border-jurnex-border bg-jurnex-bg/50" aria-hidden />,
  },
);

const LandingDemoFlujoLazy = nextDynamic(
  () => import("@/components/marketing/LandingConversion").then((m) => ({ default: m.LandingDemoFlujo })),
  {
    loading: () => <section className="min-h-[16rem] border-b border-jurnex-border bg-jurnex-bg/50" aria-hidden />,
  },
);

const LandingDiferencialLazy = nextDynamic(
  () => import("@/components/marketing/LandingConversion").then((m) => ({ default: m.LandingDiferencial })),
  {
    loading: () => <section className="min-h-[14rem] border-b border-jurnex-border bg-jurnex-bg/50" aria-hidden />,
  },
);

const CTALazy = nextDynamic(() => import("@/components/marketing/CTA").then((m) => ({ default: m.CTA })), {
  loading: () => <section className="min-h-[12rem] bg-gradient-to-b from-jurnex-bg to-[#010812]" aria-hidden />,
});

export default function HomePage() {
  return (
    <div className="jurnex-brand-layers min-h-screen bg-jurnex-bg pb-[5.5rem] md:pb-0">
      <SiteHeader />
      <Hero />
      <HowItWorksLazy />
      <LandingDemoFlujoLazy />
      <LandingDiferencialLazy />
      <CTALazy />
      <footer className="border-t border-white/12 bg-jurnex-bg px-4 py-10 text-center text-xs text-jurnex-text-primary/88">
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium">
          <Link href="/login" className="text-teal-100 underline-offset-2 hover:text-white hover:underline">
            Panel novios
          </Link>
          <span className="text-teal-200/75" aria-hidden>
            ·
          </span>
          <Link href="/invitacion/demo" className="text-teal-100 underline-offset-2 hover:text-white hover:underline">
            Demo invitación
          </Link>
        </div>
        <p className="mt-4 text-jurnex-text-secondary">© {new Date().getFullYear()} Jurnex</p>
      </footer>
      <LandingStickyCta />
    </div>
  );
}
