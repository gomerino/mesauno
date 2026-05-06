import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function MarketplaceProveedorNotFound() {
  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-white">Perfil no disponible</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          No encontramos un proveedor con ese enlace. Puede que el perfil aún esté en revisión,
          que el slug sea distinto (revisa mayúsculas y el texto exacto) o que ya no esté
          publicado.
        </p>
        <Link
          href="/marketplace"
          className={panelCtaJurnexPrimary + " mt-8 justify-center px-6 py-3"}
        >
          Ir al marketplace
        </Link>
      </main>
    </div>
  );
}
