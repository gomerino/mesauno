import Link from "next/link";

const baseClass =
  "inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-8 py-3 text-sm font-semibold text-[#0f172a] shadow-lg shadow-black/25 transition hover:brightness-110 active:scale-[0.98]";

type Props = {
  className?: string;
};

export function CrearMiEventoLink({ className = "" }: Props) {
  return (
    <Link href="/onboarding" className={[baseClass, className].filter(Boolean).join(" ")}>
      Crea tu viaje
    </Link>
  );
}
