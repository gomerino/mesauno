import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import type { Invitado } from "@/types/database";

export type InvitacionesMetricas = {
  total: number;
  pendiente: number;
  enviado: number;
  abierto: number;
  confirmado: number;
  /** Invitados que ya salieron de «pendiente» (enviado + abierto + confirmado). */
  progressPct: number;
};

/** Misma lógica que `useInvitaciones` (servidor o cliente). */
export function getInvitacionesMetricas(rows: Invitado[]): InvitacionesMetricas {
  let pendiente = 0;
  let enviado = 0;
  let abierto = 0;
  let confirmado = 0;
  for (const r of rows) {
    const e = deriveEstadoEnvio(r);
    if (e === "pendiente") pendiente++;
    else if (e === "enviado") enviado++;
    else if (e === "abierto") abierto++;
    else confirmado++;
  }
  const total = rows.length;
  const avanzados = enviado + abierto + confirmado;
  const progressPct =
    total > 0 ? Math.min(100, Math.round((avanzados / total) * 1000) / 10) : 0;
  return {
    total,
    pendiente,
    enviado,
    abierto,
    confirmado,
    progressPct,
  };
}
