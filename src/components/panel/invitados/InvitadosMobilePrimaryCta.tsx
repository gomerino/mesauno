"use client";

/**
 * CTA móvil que dispara el mismo flujo que «Añadir invitado» en la lista (id en InvitadosManager).
 */
export function InvitadosMobilePrimaryCta() {
  return (
    <button
      type="button"
      className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-teal-500 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 hover:bg-teal-400 lg:hidden"
      onClick={() => document.getElementById("invitados-btn-add")?.click()}
    >
      Añadir invitado
    </button>
  );
}
