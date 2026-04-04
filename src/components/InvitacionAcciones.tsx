"use client";

import { RSVPForm } from "@/components/RSVPForm";

type Props = {
  invitadoId: string;
  initialRestricciones: string | null;
  initialEstado: string | null;
  compact?: boolean;
};

export function InvitacionAcciones({
  invitadoId,
  initialRestricciones,
  initialEstado,
  compact = false,
}: Props) {
  return (
    <div className="w-full">
      <div className={`text-center ${compact ? "mb-2 lg:text-left" : "mb-3 lg:mb-2"}`}>
        <h2
          className={`font-display font-bold text-gray-900 ${compact ? "text-base lg:text-[15px]" : "text-lg lg:text-base"}`}
        >
          Tu respuesta
        </h2>
        <p className={`mt-0.5 text-gray-600 ${compact ? "text-[11px]" : "text-xs lg:text-[11px]"}`}>
          Confirmar · Restricciones · Fondo de millas
        </p>
      </div>

      <RSVPForm
        invitadoId={invitadoId}
        initialRestricciones={initialRestricciones}
        initialEstado={initialEstado}
        compact={compact}
      />
    </div>
  );
}
