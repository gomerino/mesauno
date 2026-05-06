"use client";

import { panelCtaJurnexPrimary } from "@/components/panel/ds";

/**
 * CTA móvil que dispara el mismo flujo que «Añadir invitado» en la lista (id en InvitadosManager).
 */
export function InvitadosMobilePrimaryCta() {
  return (
    <button
      type="button"
      className={panelCtaJurnexPrimary + " min-h-[48px] w-full justify-center px-4 lg:hidden"}
      onClick={() => document.getElementById("invitados-btn-add")?.click()}
    >
      Añadir invitado
    </button>
  );
}
