import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  className?: string;
  withEmoji?: boolean;
  children?: ReactNode;
};

export function CrearMiEventoLink({ className = "", withEmoji = false, children }: Props) {
  return (
    <Link
      href="/onboarding"
      className={[panelCtaJurnexPrimary, "min-h-[48px] justify-center px-8 py-3", withEmoji ? "jurnex-cta-pulse" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children ?? "Crea tu viaje"}
      {withEmoji ? (
        <span className="jurnex-cta-emoji ml-2 inline-block" aria-hidden>
          ✨
        </span>
      ) : null}
    </Link>
  );
}
