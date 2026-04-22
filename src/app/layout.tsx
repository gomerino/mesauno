import { InstallButton } from "@/components/InstallButton";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
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

export const metadata: Metadata = {
  title: "Jurnex — Tu boda, tu viaje",
  description: "Plataforma de matrimonios con invitaciones estilo boarding pass y marketplace.",
  manifest: "/manifest.json",
  themeColor: "#0B1220",
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
        {children}
        <InstallButton />
      </body>
    </html>
  );
}
