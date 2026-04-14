"use client";

import { sendInvitationsFromPanelAction } from "@/app/panel/invitaciones-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  eventoId: string;
  totalInvitados: number;
  emailsEnviados: number;
  invitacionesVistas: number;
};

export function InvitacionMetricasCard({
  eventoId,
  totalInvitados,
  emailsEnviados,
  invitacionesVistas,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const tasaPct =
    emailsEnviados > 0 ? Math.round((invitacionesVistas / emailsEnviados) * 1000) / 10 : 0;

  async function run(mode: "unsent" | "pending_rsvp") {
    setMessage(null);
    startTransition(async () => {
      const res = await sendInvitationsFromPanelAction(eventoId, mode);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const extra =
        res.errors.length > 0 ? ` · Avisos: ${res.errors.slice(0, 2).join("; ")}` : "";
      setMessage(`Enviados: ${res.sent}${res.skipped ? ` · Omitidos: ${res.skipped}` : ""}${extra}`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Seguimiento
      </p>
      <h2 className="font-display mt-2 text-xl font-bold text-white">Correos e invitación</h2>
      <p className="mt-1 text-sm text-slate-400">
        Cuántos correos enviaste, cuántas invitaciones se abrieron y el avance general.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Enviados / Total</p>
          <p className="font-display mt-1 text-2xl font-bold tabular-nums text-white">
            {emailsEnviados}
            <span className="text-slate-500"> / </span>
            {totalInvitados}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Han visto la invitación</p>
          <p className="font-display mt-1 text-2xl font-bold tabular-nums text-teal-300">{invitacionesVistas}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Aperturas (si hubo correos)</p>
          <p className="font-display mt-1 text-2xl font-bold tabular-nums text-white">
            {emailsEnviados > 0 ? `${tasaPct} %` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("unsent")}
          className="rounded-full bg-[#001d66] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#002a8c] disabled:opacity-50"
        >
          Enviar a pendientes de correo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void run("pending_rsvp")}
          className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Re-enviar a pendientes de confirmación
        </button>
      </div>

      {message && (
        <p className="mt-4 text-sm text-slate-300" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
