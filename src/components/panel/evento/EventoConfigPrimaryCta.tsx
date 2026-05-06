"use client";

import { panelBtnPrimary } from "@/components/panel/ds";
import { useEventoCentroTab } from "@/components/panel/evento/EventoCentroTabContext";
import type { EventoConfigCTAResult } from "@/lib/evento-config-cta";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  result: Extract<EventoConfigCTAResult, { status: "pending" }>;
  className?: string;
};

export function EventoConfigPrimaryCta({ result, className = "" }: Props) {
  const ctx = useEventoCentroTab();
  const router = useRouter();

  return (
    <button
      type="button"
      className={`${panelBtnPrimary} h-12 w-full items-center justify-center text-center ${className}`.trim()}
      onClick={() => {
        if (result.action === "programa") {
          router.push("/panel/viaje?tab=experiencia");
          return;
        }
        if (result.action === "tab" && ctx) {
          ctx.setTab(result.tab);
        }
      }}
    >
      {result.label}
    </button>
  );
}

export function EventoConfigCompleteNote() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/60">Evento listo ✨</p>
      <Link
        href="/panel/pasajeros"
        className={`${panelBtnPrimary} w-full items-center justify-center py-3.5 text-center md:w-auto md:min-w-[16rem] md:py-3`}
      >
        Enviar invitaciones →
      </Link>
      <p className="text-xs leading-snug text-white/45 md:max-w-md">
        Usa tu lista para enviar y hacer seguimiento
      </p>
    </div>
  );
}
