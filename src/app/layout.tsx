import SchemaOrg from "@/components/SchemaOrg";
import { InstallButton } from "@/components/InstallButton";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import {
  JURNEX_HOME_DESCRIPTION,
  JURNEX_HOME_TITLE,
  JURNEX_OG_DESCRIPTION_SHORT,
  JURNEX_OG_IMAGE_ALT,
  JURNEX_OG_IMAGE_PATH,
  JURNEX_OG_TITLE_SHORT,
  JURNEX_TWITTER_DESCRIPTION,
} from "@/lib/seo-jurnex-home";
import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
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

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.jurnex.cl";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: JURNEX_HOME_TITLE,
    template: "%s | Jurnex",
  },
  description: JURNEX_HOME_DESCRIPTION,
  alternates: {
    canonical: "https://www.jurnex.cl",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Jurnex",
    title: JURNEX_OG_TITLE_SHORT,
    description: JURNEX_OG_DESCRIPTION_SHORT,
    url: "https://www.jurnex.cl",
    locale: "es_CL",
    images: [
      {
        url: JURNEX_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: JURNEX_OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: JURNEX_OG_TITLE_SHORT,
    description: JURNEX_TWITTER_DESCRIPTION,
    images: [JURNEX_OG_IMAGE_PATH],
  },
  manifest: "/manifest.json",
  themeColor: "#02182a",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
      <head>
        <SchemaOrg />
      </head>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
        <InstallButton />
      </body>
    </html>
  );
}
