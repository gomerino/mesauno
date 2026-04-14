import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import type { MarketplaceServicio } from "@/types/database";

type SearchParams = { categoria?: string };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  const { data: allCats } = await supabase.from("marketplace_servicios").select("categoria");
  const categorias = Array.from(
    new Set((allCats ?? []).map((r: { categoria: string }) => r.categoria))
  ).sort();

  let query = supabase.from("marketplace_servicios").select("*").order("nombre");

  if (categoria && categoria !== "todas") {
    query = query.eq("categoria", categoria);
  }

  const { data: servicios, error } = await query;

  const list = (servicios ?? []) as MarketplaceServicio[];

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-white">Marketplace</h1>
        <p className="mt-2 text-slate-400">
          Encuentra proveedores para tu matrimonio: fotografía, música, catering y más. Filtra por categoría.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-orange-500/20 p-4 text-sm text-orange-200">
            No se pudieron cargar los servicios ahora. Intenta de nuevo en unos minutos.
          </p>
        )}

        <MarketplaceFilters categorias={categorias} active={categoria ?? "todas"} />

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-teal-500/30"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-teal-400">
                {s.categoria}
              </span>
              <h2 className="mt-2 font-display text-lg font-semibold text-white">{s.nombre}</h2>
              {s.descripcion && <p className="mt-2 text-sm text-slate-400">{s.descripcion}</p>}
              <div className="mt-4 flex items-center justify-between text-sm">
                {s.precio_desde != null && (
                  <span className="font-semibold text-orange-300">
                    desde{" "}
                    {Number(s.precio_desde).toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                )}
                {s.proveedor && <span className="text-slate-500">{s.proveedor}</span>}
              </div>
            </li>
          ))}
        </ul>

        {!error && list.length === 0 && (
          <p className="mt-8 text-center text-slate-500">No hay servicios con este filtro.</p>
        )}
      </main>
    </div>
  );
}
