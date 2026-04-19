import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import {
  esCategoriaProveedor,
  labelCategoria,
  labelRegion,
  listarTarjetasMarketplace,
  PROVEEDOR_CATEGORIAS,
} from "@/lib/proveedores";
import type { MarketplaceTarjeta } from "@/types/database";

type SearchParams = { categoria?: string };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  const categoriaFiltro =
    categoria && categoria !== "todas" && esCategoriaProveedor(categoria)
      ? categoria
      : undefined;

  const opcionesCategoria = PROVEEDOR_CATEGORIAS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  let tarjetas: MarketplaceTarjeta[] = [];
  let error: Error | null = null;

  try {
    const res = await listarTarjetasMarketplace(supabase, {
      categoria: categoriaFiltro,
    });
    tarjetas = res.tarjetas;
  } catch (e) {
    error = e instanceof Error ? e : new Error("Error desconocido");
  }

  const activeFiltro = categoriaFiltro ?? "todas";

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-white">Marketplace</h1>
        <p className="mt-2 text-slate-400">
          Encuentra proveedores para tu matrimonio: fotografía, música, catering y más. Filtra
          por categoría.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-orange-500/20 p-4 text-sm text-orange-200">
            No se pudieron cargar los proveedores ahora. Intenta de nuevo en unos minutos.
          </p>
        )}

        <MarketplaceFilters categorias={opcionesCategoria} active={activeFiltro} />

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {tarjetas.map((t) => (
            <li key={t.id}>
              <Link
                href={`/marketplace/${t.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-0 backdrop-blur transition hover:border-teal-500/40 hover:bg-white/[0.07]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-slate-800/80">
                  {t.imagen_hero_url ? (
                    <Image
                      src={t.imagen_hero_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Sin foto aún
                    </div>
                  )}
                  {t.plan === "premium" && (
                    <span className="absolute right-3 top-3 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950">
                      Premium
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium uppercase tracking-wider text-teal-400">
                    {labelCategoria(t.categoria_principal)}
                  </span>
                  <h2 className="mt-1 font-display text-lg font-semibold text-white">
                    {t.nombre_negocio}
                  </h2>
                  {t.eslogan && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{t.eslogan}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-slate-500">
                      {labelRegion(t.region)}
                      {t.ciudad ? ` · ${t.ciudad}` : ""}
                    </span>
                    {t.precio_desde_clp != null && (
                      <span className="font-semibold text-orange-300">
                        desde{" "}
                        {Number(t.precio_desde_clp).toLocaleString("es-CL", {
                          style: "currency",
                          currency: "CLP",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {!error && tarjetas.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            <p>No hay proveedores con este filtro todavía.</p>
            <p className="mt-3 text-slate-500">
              Los perfiles nuevos aparecen aquí cuando el equipo los aprueba (objetivo máximo 48 h).
              Si acabas de registrarte, revisa tu correo o el panel de proveedor.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
