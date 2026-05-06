import { panelCtaJurnexPrimary } from "@/components/panel/ds";
import Link from "next/link";

type Props = {
  className?: string;
  withEmoji?: boolean;
};

export function CrearMiEventoLink({ className = "", withEmoji = false }: Props) {
  return (
    <Link
      href="/onboarding"
      className={[panelCtaJurnexPrimary, "min-h-[48px] justify-center px-8 py-3", withEmoji ? "jurnex-cta-pulse" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      Crea tu viaje
      {withEmoji ? (
        <span className="jurnex-cta-emoji ml-2 inline-block" aria-hidden>
          ✨
        </span>
      ) : null}
    </Link>
  );
}
