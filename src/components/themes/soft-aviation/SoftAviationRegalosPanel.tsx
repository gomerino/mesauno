"use client";

/**
 * Datos de transferencia (misma referencia que `RSVPForm` · Fondo de millas).
 * Cuando exista configuración por evento, sustituir por props / API.
 */
const TRANSFER = {
  intro:
    "Si quieres acompañarnos con un regalo 🎁, puedes transferir a nuestra próxima aventura.",
  cuenta: "53-17217-05",
  banco: "Banco de Chile",
  rut: "13.468.424-0",
  nombre: "Claudia Ibáñez Salas",
} as const;

export function SoftAviationRegalosPanel() {
  return (
    <div className="animate-fadeIn px-1 py-4">
      <div className="mx-auto max-w-md rounded-2xl border border-invite-navy/10 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-invite-navy/45">Regalos</p>
        <h2 className="mt-1 font-inviteSerif text-lg font-semibold text-invite-navy sm:text-xl">Fondo de millas</h2>
        <p className="mt-3 text-sm leading-relaxed text-invite-navy/80">{TRANSFER.intro}</p>

        <div className="mt-4 overflow-hidden rounded-xl border border-invite-navy/12 bg-invite-sand/80 px-3 py-3 sm:px-4 sm:py-3.5">
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col gap-0.5 border-b border-invite-navy/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-invite-navy/50">Cuenta corriente</dt>
              <dd className="font-inviteMono text-base font-semibold tabular-nums text-invite-navy">{TRANSFER.cuenta}</dd>
            </div>
            <div className="flex flex-col gap-0.5 border-b border-invite-navy/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-invite-navy/50">Banco</dt>
              <dd className="font-medium text-invite-navy">{TRANSFER.banco}</dd>
            </div>
            <div className="flex flex-col gap-0.5 border-b border-invite-navy/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-invite-navy/50">RUT</dt>
              <dd className="font-inviteMono text-base font-semibold tabular-nums text-invite-navy">{TRANSFER.rut}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-invite-navy/50">Nombre</dt>
              <dd className="break-words font-medium text-invite-navy">{TRANSFER.nombre}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-3 text-center text-[11px] leading-snug text-invite-navy/55">
          Gracias por su cariño <span aria-hidden>✈️</span>
        </p>
      </div>
    </div>
  );
}
