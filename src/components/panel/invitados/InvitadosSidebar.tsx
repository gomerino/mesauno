"use client";

import { InvitadosBulkEmailActions } from "@/components/panel/invitados/InvitadosBulkEmailActions";
import { trackEvent } from "@/lib/analytics";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";

type Props = {
  eventoId: string | null;
  hasInvitados: boolean;
  fromMission: boolean;
  totalInvitados: number;
  emailsEnviados: number;
  abrieronTrasCorreo: number;
  tasaAperturaPct: number;
};

function EstadoDelViajeBlock({
  totalInvitados,
  emailsEnviados,
  totalCorreos,
  abrieronTrasCorreo,
  tasaAperturaPct,
}: {
  totalInvitados: number;
  emailsEnviados: number;
  totalCorreos: number;
  abrieronTrasCorreo: number;
  tasaAperturaPct: number;
}) {
  const tasaStr = emailsEnviados > 0 ? `${tasaAperturaPct}%` : "—";
  const metricsLine = `${emailsEnviados} / ${totalCorreos} enviados · ${abrieronTrasCorreo} abrieron · ${tasaStr}`;
  const progressPct =
    totalCorreos > 0 ? Math.min(100, Math.round((emailsEnviados / totalCorreos) * 1000) / 10) : 0;
  const pasajerosLabel =
    totalInvitados === 1 ? "1 pasajero" : `${totalInvitados} pasajeros`;

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-5">
      <h3 className="text-sm font-medium text-white/90">
        Estado del viaje <span aria-hidden>✨</span>
      </h3>
      <p className="mt-3 text-xs text-white/60">{pasajerosLabel}</p>
      <p className="mt-1 text-xs tabular-nums text-white/60">{metricsLine}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-yellow-400"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

function WhatsAppNoteCollapsible() {
  return (
    <details className="group rounded-xl border border-white/10 bg-black/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-xs font-medium text-white/70 [&::-webkit-details-marker]:hidden">
        <span>WhatsApp</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <p className="border-t border-white/10 px-4 pb-3 pt-2 text-xs leading-relaxed text-white/50">
        Un envío por invitado desde cada fila; tú confirmas en tu app. Sin campañas automáticas por este
        canal.
      </p>
    </details>
  );
}

export function InvitadosSidebar({
  eventoId,
  hasInvitados,
  fromMission,
  totalInvitados,
  emailsEnviados,
  abrieronTrasCorreo,
  tasaAperturaPct,
}: Props) {
  useEffect(() => {
    trackEvent("guests_page_viewed", { from_mission: fromMission });
  }, [fromMission]);

  if (!eventoId) {
    return null;
  }

  const totalCorreos = totalInvitados;

  return (
    <div className="flex flex-col gap-4">
      <EstadoDelViajeBlock
        totalInvitados={totalInvitados}
        emailsEnviados={emailsEnviados}
        totalCorreos={totalCorreos}
        abrieronTrasCorreo={abrieronTrasCorreo}
        tasaAperturaPct={tasaAperturaPct}
      />

      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Acciones</p>
        {hasInvitados ? (
          <div className="mt-3">
            <InvitadosBulkEmailActions eventoId={eventoId} compact />
          </div>
        ) : (
          <p className="mt-2 text-xs leading-snug text-white/50">
            Añade personas a la lista para habilitar el envío masivo por correo.
          </p>
        )}
      </div>

      <WhatsAppNoteCollapsible />
    </div>
  );
}
