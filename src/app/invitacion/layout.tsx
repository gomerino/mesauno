import { Courier_Prime, Montserrat, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-invite-serif",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-invite-body",
  display: "swap",
});

const ticketMono = Courier_Prime({
  subsets: ["latin"],
  variable: "--font-invite-mono",
  weight: ["400", "700"],
  display: "swap",
});

export default function InvitacionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${montserrat.variable} ${ticketMono.variable}`}>{children}</div>
  );
}
