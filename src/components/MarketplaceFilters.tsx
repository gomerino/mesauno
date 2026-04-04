"use client";

import Link from "next/link";

type Props = {
  categorias: string[];
  active: string;
};

export function MarketplaceFilters({ categorias, active }: Props) {
  const all = ["todas", ...categorias];

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {all.map((cat) => {
        const href = cat === "todas" ? "/marketplace" : `/marketplace?categoria=${encodeURIComponent(cat)}`;
        const isOn = cat === "todas" ? active === "todas" : active === cat;
        return (
          <Link
            key={cat}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              isOn
                ? "bg-teal-500 text-white"
                : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {cat === "todas" ? "Todas" : cat}
          </Link>
        );
      })}
    </div>
  );
}
