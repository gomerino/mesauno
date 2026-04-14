import Link from "next/link";

type Props = { compact?: boolean };

export function SiteHeader({ compact = false }: Props) {
  const pad = compact ? "py-2 sm:py-2.5" : "py-4";
  const title = compact ? "text-lg sm:text-xl" : "text-xl";
  return (
    <header className="shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className={`mx-auto flex max-w-5xl items-center justify-between px-3 sm:px-4 ${pad}`}>
        <Link href="/" className={`font-display font-semibold tracking-tight text-white ${title}`}>
          Dreams Wedding
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-teal-100/90 sm:gap-x-6 sm:text-sm">
          <Link href="/onboarding" className="hover:text-white">
            Demo gratis
          </Link>
          <Link href="/pricing" className="font-medium text-[#D4AF37]/95 hover:text-[#D4AF37]">
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
