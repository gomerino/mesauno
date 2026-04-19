"use client";

import Link from "next/link";

export type OpcionCategoriaMarketplace = {
  value: string;
  label: string;
};

type Props = {
  categorias: OpcionCategoriaMarketplace[];
  active: string;
};

export function MarketplaceFilters({ categorias, active }: Props) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link
        href="/marketplace"
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          active === "todas"
            ? "bg-teal-500 text-white"
            : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
        }`}
      >
        Todas
      </Link>
      {categorias.map((cat) => {
        const href = `/marketplace?categoria=${encodeURIComponent(cat.value)}`;
        const isOn = active === cat.value;
        return (
          <Link
            key={cat.value}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isOn
                ? "bg-teal-500 text-white"
                : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}
