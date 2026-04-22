"use client";

import { createClient } from "@/lib/supabase/client";
import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import { supabaseErrorMessage } from "@/lib/supabase-error";
import type { CanalEnvioInvitacion, Invitado } from "@/types/database";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const MOCK_MS = 420;

async function mockEnvioDelay() {
  await new Promise((r) => setTimeout(r, MOCK_MS));
}

type BusyScope = "global" | `mesa:${string}` | `row:${string}` | null;

export function useEnvioInvitaciones(eventoId: string | null, canal: CanalEnvioInvitacion) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [busyScope, setBusyScope] = useState<BusyScope>(null);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const enviarPendientes = useCallback(
    async (ids: string[]) => {
      if (!eventoId || ids.length === 0) return;
      const now = new Date().toISOString();
      await mockEnvioDelay();
      const { error } = await supabase
        .from("invitados")
        .update({
          estado_envio: "enviado",
          fecha_envio: now,
          canal_envio: canal,
          email_enviado: true,
        })
        .in("id", ids);
      if (error) {
        toast.error(supabaseErrorMessage(error), { duration: 5000 });
        return;
      }
      toast.success(ids.length === 1 ? "Invitación enviada" : "Invitaciones enviadas", {
        duration: 3500,
      });
      refresh();
    },
    [eventoId, supabase, canal, refresh]
  );

  const reenviar = useCallback(
    async (ids: string[]) => {
      if (!eventoId || ids.length === 0) return;
      const now = new Date().toISOString();
      await mockEnvioDelay();
      const { error } = await supabase
        .from("invitados")
        .update({
          fecha_envio: now,
          canal_envio: canal,
        })
        .in("id", ids);
      if (error) {
        toast.error(supabaseErrorMessage(error), { duration: 5000 });
        return;
      }
      toast.success(ids.length === 1 ? "Reenvío registrado" : "Reenvíos registrados", {
        duration: 3500,
      });
      refresh();
    },
    [eventoId, supabase, canal, refresh]
  );

  const enviarTodosPendientes = useCallback(
    async (rows: Invitado[]) => {
      if (!eventoId) {
        toast.error("Necesitás un evento activo para enviar.", { duration: 4000 });
        return;
      }
      const ids = rows
        .filter((r) => deriveEstadoEnvio(r) === "pendiente")
        .map((r) => r.id);
      if (ids.length === 0) {
        toast.message("No hay invitaciones pendientes de envío.", { duration: 3000 });
        return;
      }
      setBusyScope("global");
      try {
        await enviarPendientes(ids);
      } finally {
        setBusyScope(null);
      }
    },
    [eventoId, enviarPendientes]
  );

  const enviarIds = useCallback(
    async (scope: BusyScope, ids: string[]) => {
      if (!eventoId || ids.length === 0) return;
      setBusyScope(scope);
      try {
        await enviarPendientes(ids);
      } finally {
        setBusyScope(null);
      }
    },
    [eventoId, enviarPendientes]
  );

  const reenviarIds = useCallback(
    async (scope: BusyScope, ids: string[]) => {
      if (!eventoId || ids.length === 0) return;
      setBusyScope(scope);
      try {
        await reenviar(ids);
      } finally {
        setBusyScope(null);
      }
    },
    [eventoId, reenviar]
  );

  return {
    busyScope,
    enviarTodosPendientes,
    enviarIds,
    reenviarIds,
  };
}
