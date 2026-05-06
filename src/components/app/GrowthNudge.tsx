import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  message: ReactNode;
  href?: string;
  ctaLabel?: string;
};

/** Mensaje breve de activación (sin datos técnicos). */
export function GrowthNudge({ message, href, ctaLabel = "Completar" }: Props) {
  return (
    <div
      className="rounded-xl border border-teal-500/30 bg-teal-500/[0.12] px-4 py-3 text-sm text-teal-50 shadow-[0_0_0_1px_rgba(232,154,30,0.14)]"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 leading-relaxed">{message}</p>
        {href ? (
          <Link
            href={href}
            className={panelCtaJurnexPrimary + " shrink-0 justify-center px-4 py-2"}
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
