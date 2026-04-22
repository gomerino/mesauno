import type { Invitado } from "@/types/database";
import { getInvitacionesMetricas, type InvitacionesMetricas } from "@/lib/invitaciones-metricas";
import { useMemo } from "react";

export type { InvitacionesMetricas };

export function useInvitaciones(rows: Invitado[]): InvitacionesMetricas {
  return useMemo(() => getInvitacionesMetricas(rows), [rows]);
}
