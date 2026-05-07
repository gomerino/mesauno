import { Hero } from "@/components/marketing/Hero";
import { LandingHomeJsonLd } from "@/components/marketing/LandingHomeJsonLd";
import { LandingStickyCta } from "@/components/marketing/LandingStickyCta";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl";

const titleDefault = "Jurnex — Organiza tu matrimonio sin caos";
const descriptionDefault =
  "Invitaciones digitales, lista de invitados y experiencia del gran día en un solo lugar. Menos caos, más claridad para tu matrimonio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: titleDefault,
  description: descriptionDefault,
  keywords: [
    "Jurnex",
    "matrimonio",
    "boda",
    "invitaciones digitales",
    "lista de invitados",
    "RSVP",
    "planificación de eventos",
    "Chile",
    "LATAM",
  ],
  authors: [{ name: "Jurnex", url: siteUrl }],
  creator: "Jurnex",
  publisher: "Jurnex",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: titleDefault,
    description: descriptionDefault,
    url: "/",
    siteName: "Jurnex",
    locale: "es_CL",
    alternateLocale: ["es_LA"],
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jurnex — tu boda, tu viaje",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titleDefault,
    description: descriptionDefault,
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
      <LandingHomeJsonLd siteUrl={siteUrl} />
      <SiteHeader prominentLogo />
      <main id="contenido-principal">
        <Hero />
        <HowItWorksLazy />
        <LandingDemoFlujoLazy />
        <LandingDiferencialLazy />
        <CTALazy />
      </main>
      <footer className="border-t border-white/12 bg-jurnex-bg px-4 py-10 text-center text-xs text-jurnex-text-primary/88">
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium">
          <Link href="/login" className="text-teal-100 underline-offset-2 hover:text-white hover:underline">
            Panel novios
          </Link>
        </div>
        <p className="mt-4 text-jurnex-text-secondary">© {new Date().getFullYear()} Jurnex</p>
      </footer>
      <LandingStickyCta />
    </div>
  );
}
