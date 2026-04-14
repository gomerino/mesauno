import Link from "next/link";

/** CTA fija solo en móvil — no interfiere con el FAB de invitación en otras rutas (solo se usa en `/`). */
export function LandingStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-[#D4AF37]/25 bg-[#0f172a]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md md:hidden">
      <div className="flex flex-col gap-2">
        <Link
          href="/onboarding"
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] text-sm font-bold tracking-wide text-[#0f172a] transition hover:brightness-110 active:scale-[0.99]"
        >
          Probar demo gratis
        </Link>
        <Link
          href="/pricing"
          className="text-center text-xs font-medium text-[#D4AF37]/90 underline-offset-2 hover:text-[#D4AF37] hover:underline"
        >
          Ver planes y precios
        </Link>
      </div>
    </div>
  );
}
