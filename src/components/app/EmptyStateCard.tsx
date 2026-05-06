import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  secondary?: ReactNode;
};

export function EmptyStateCard({ title, description, actionHref, actionLabel, secondary }: Props) {
  return (
    <div
      className="mt-8 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center sm:p-8"
      role="status"
    >
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      <div className="mt-2 text-sm text-slate-400">{description}</div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={panelCtaJurnexPrimary + " mt-6 min-h-[44px] justify-center px-5 py-2.5"}
        >
          {actionLabel}
        </Link>
      ) : null}
      {secondary ? <div className="mt-4">{secondary}</div> : null}
    </div>
  );
}
