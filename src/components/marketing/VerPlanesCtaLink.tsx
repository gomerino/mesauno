import Link from "next/link";
import { PRICING_PLANS } from "@/lib/pricing-plans";

const baseClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98]";

type Props = {
  className?: string;
};

/** CTA secundario hacia pricing (precio del plan más accesible). */
export function VerPlanesCtaLink({ className = "" }: Props) {
  const label = `Ver planes desde ${PRICING_PLANS.esencial.priceLabel}`;
  return (
    <Link href="/pricing" className={[baseClass, className].filter(Boolean).join(" ")}>
      {label}
    </Link>
  );
}
