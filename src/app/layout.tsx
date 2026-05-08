import { InstallButton } from "@/components/InstallButton";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl"),
  title: {
    default: "Jurnex — Tu boda, tu viaje",
    template: "%s | Jurnex",
  },
  description: "Plataforma de matrimonios con invitaciones estilo boarding pass y marketplace.",
  manifest: "/manifest.json",
  themeColor: "#02182a",
  icons: {
    icon: [{ url: "/brand/jurnex/logos/full/jurnex-logo-full.png", type: "image/png", sizes: "1024x1024" }],
    apple: "/brand/jurnex/logos/full/jurnex-logo-full.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jurnex",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`scroll-smooth ${outfit.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        <Script
          id="jsonld-software"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Jurnex",
              url: "https://www.jurnex.cl",
              description:
                "Plataforma de organización de matrimonios con invitaciones digitales estilo boarding pass, RSVP, gestión de invitados y programa del evento.",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "CLP",
                description: "Registro gratuito disponible",
              },
              inLanguage: "es-CL",
              areaServed: {
                "@type": "Country",
                name: "Chile",
              },
              featureList: [
                "Invitaciones digitales estilo boarding pass",
                "Gestión de invitados y confirmaciones RSVP",
                "Programa del evento en tiempo real",
                "Playlist colaborativa para la fiesta",
                "Dashboard de organización para novios",
              ],
              screenshot: "https://www.jurnex.cl/og-image.jpg",
              author: {
                "@type": "Organization",
                name: "Jurnex",
                url: "https://www.jurnex.cl",
              },
            }),
          }}
        />
        <Script
          id="jsonld-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Jurnex",
              url: "https://www.jurnex.cl",
              description:
                "Organiza tu matrimonio sin caos. Invitaciones digitales, RSVP y programa del evento en un solo lugar.",
              inLanguage: "es-CL",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://www.jurnex.cl/onboarding",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {children}
        <InstallButton />
      </body>
    </html>
  );
}
