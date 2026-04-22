import { JURNEX_BRAND } from "@/components/brand/jurnex-assets";
import Link from "next/link";

type Props = { compact?: boolean };

export function SiteHeader({ compact = false }: Props) {
  const pad = compact ? "py-2 sm:py-2.5" : "py-4";
  const logoH = compact ? "h-6 sm:h-7" : "h-7 sm:h-8";
  return (
    <header className="shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className={`mx-auto flex max-w-5xl items-center justify-between px-3 sm:px-4 ${pad}`}>
        <Link href="/" className={`block shrink-0 ${logoH} w-auto max-w-[min(100%,10.5rem)] sm:max-w-[12rem]`}>
          <img
            src={JURNEX_BRAND.logos.simplified}
            alt="Jurnex"
            width={256}
            height={256}
            className="h-full w-auto object-contain object-left"
            decoding="async"
          />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-teal-100/90 sm:gap-x-6 sm:text-sm">
          <Link href="/onboarding" className="hover:text-white">
            Demo gratis
          </Link>
          <Link href="/pricing" className="font-medium text-jurnex-secondary/95 hover:text-jurnex-secondary">
            Planes y precios
          </Link>
          <Link href="/marketplace" className="hover:text-white">
            Marketplace
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/20 sm:px-4 sm:py-2"
          >
            Panel novios
          </Link>
        </nav>
      </div>
    </header>
  );
}
