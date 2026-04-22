import { panelBtnPrimary } from "@/components/panel/ds";
import Link from "next/link";

type Props = {
  title?: string;
  description: string;
  action: string;
  href: string;
};

export function EventoNextStepCard({
  title = "Siguiente paso recomendado",
  description,
  action,
  href,
}: Props) {
  return (
    <div className="rounded-lg border border-[#F5C451]/25 bg-black/30 p-4 shadow-[0_0_28px_-10px_rgba(245,196,81,0.35)] backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F5C451]/80">{title}</p>
      <p className="mt-2 text-sm text-white/85">{description}</p>
      <Link href={href} className={`${panelBtnPrimary} mt-3 inline-flex w-full justify-center text-center sm:w-auto`}>
        {action}
      </Link>
    </div>
  );
}
