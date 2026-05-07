import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import { Plane } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  className?: string;
  withEmoji?: boolean;
  /** Icono avión tras el texto (prioridad sobre ✨ si ambos vienen por error). */
  planeIcon?: boolean;
  children?: ReactNode;
};

export function CrearMiEventoLink({ className = "", withEmoji = false, planeIcon = false, children }: Props) {
  const showSparkle = withEmoji && !planeIcon;

  return (
    <Link
      href="/onboarding"
      className={[panelCtaJurnexPrimary, "min-h-[48px] justify-center gap-2 px-8 py-3", withEmoji ? "jurnex-cta-pulse" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children ?? "Crear mi viaje"}
      {planeIcon ? (
        <Plane className="h-[1.05em] w-[1.05em] shrink-0 stroke-[2.25]" aria-hidden />
      ) : null}
      {showSparkle ? (
        <span className="jurnex-cta-emoji ml-0.5 inline-block" aria-hidden>
          ✨
        </span>
      ) : null}
    </Link>
  );
}
