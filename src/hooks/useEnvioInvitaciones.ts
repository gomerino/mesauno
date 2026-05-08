"use client";

import type { WhatsappColaItem } from "@/components/panel/pasajeros/whatsapp-cola";
import { createClient } from "@/lib/supabase/client";
import { deriveEstadoEnvio } from "@/lib/invitado-estado-envio";
import {
  buildWhatsappInvitacionHref,
  buildWhatsappRecordatorioHref,
  isWhatsappAppDeepLinkPreferred,
} from "@/lib/invitacion-whatsapp-link";
import { JX } from "@/lib/jurnex-voz";
import { supabaseErrorMessage } from "@/lib/supabase-error";
import type { CanalEnvioInvitacion, Invitado } from "@/types/database";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const MOCK_MS = 420;

async function mockEnvioDelay() {
  await new Promise((r) => setTimeout(r, MOCK_MS));
}

function siteOriginClient(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

type BusyScope = "global" | `mesa:${string}` | `row:${string}` | null;

export type WhatsappColaContext = { kind: "envio" | "insistir"; skippedSinTelefono: number };

type UseEnvioOptions = {
  onWhatsappCola?: (items: WhatsappColaItem[], ctx: WhatsappColaContext) => void;
};

export function useEnvioInvitaciones(
  eventoId: string | null,
  canal: CanalEnvioInvitacion,
  options?: UseEnvioOptions
) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [busyScope, setBusyScope] = useState<BusyScope>(null);
  const onWhatsappCola = options?.onWhatsappCola;

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const enviarPendienteFilas = useCallback(
    async (filas: Invitado[]) => {
      if (!eventoId || filas.length === 0) return;
      const now = new Date().toISOString();
      await mockEnvioDelay();
      const origin = siteOriginClient();
      const waTarget = isWhatsappAppDeepLinkPreferred() ? "app" : "https";

      if (canal === "whatsapp") {
        const conTel = filas.filter((r) => buildWhatsappInvitacionHref(r, origin));
        const sinTel = filas.length - conTel.length;
        if (conTel.length === 0) {
          toast.error(
            "Ningún invitado pendiente tiene en la ficha un móvil que podamos usar para abrirle WhatsApp.",
            {
              duration: 5000,
            }
          );
          return;
        }
        const ids = conTel.map((r) => r.id);
        const { error } = await supabase
          .from("invitados")
          .update({
            estado_envio: "enviado",
            fecha_envio: now,
            canal_envio: "whatsapp",
          })
          .in("id", ids);
        if (error) {
          toast.error(supabaseErrorMessage(error), { duration: 5000 });
          return;
        }
        const items: WhatsappColaItem[] = conTel.map((r) => ({
          id: r.id,
          nombre: r.nombre_pasajero,
          href: buildWhatsappInvitacionHref(r, origin, { target: waTarget })!,
        }));
        onWhatsappCola?.(items, { kind: "envio", skippedSinTelefono: sinTel });
        if (sinTel > 0) {
          toast.message(
            sinTel === 1
              ? "A uno le falta un móvil en la ficha. El resto, abre su saludo en el recuadro o la lista de abajo."
              : `A ${sinTel} les falta móvil en la ficha. El resto, a quien le toca, abre su saludo abajo.`,
            { duration: 4500 }
          );
        }
        toast.success(
          conTel.length === 1
            ? "Listo. Abre tú su WhatsApp en el recuadro. El correo no lo mandamos con este toque."
            : "Listo. Abre cada chat en el recuadro, uno a uno. El correo no lo mandamos con este toque.",
          { duration: 4500 }
        );
        refresh();
        return;
      }

      const ids = filas.map((r) => r.id);
      const errores: string[] = [];
      let ok = 0;
      for (const invitadoId of ids) {
        const res = await fetch("/api/invitaciones/enviar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitadoId, eventoId, canal }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          errores.push(data.error ?? res.statusText);
        } else {
          ok += 1;
        }
      }

      if (ok > 0 && errores.length === 0) {
        toast.success(JX.emailEnviada(ids.length === 1), {
          duration: 3500,
        });
        refresh();
        return;
      }
      if (ok > 0 && errores.length > 0) {
        toast.warning(JX.envioConFallos(ok, errores.length), { duration: 5000 });
        toast.error(errores[0] ?? JX.errGenerico, { duration: 6000 });
        refresh();
        return;
      }
      const msg = errores[0] ?? "No se pudo enviar el correo. Revisa e inténtalo de nuevo.";
      toast.error(msg, { duration: 6000 });
    },
    [eventoId, supabase, canal, refresh, onWhatsappCola]
  );

  const reenviarLote = useCallback(
    async (filas: Invitado[]) => {
      if (!eventoId || filas.length === 0) return;
      await mockEnvioDelay();
      const origin = siteOriginClient();
      const waTarget = isWhatsappAppDeepLinkPreferred() ? "app" : "https";

      if (canal === "whatsapp") {
        const conTel = filas.filter((r) => buildWhatsappRecordatorioHref(r, origin));
        const sinTel = filas.length - conTel.length;
        if (conTel.length === 0) {
          toast.error(
            "Ninguno de quien aplica tiene en la ficha un móvil con el que abrir WhatsApp.",
            {
              duration: 5000,
            }
          );
          return;
        }
        const now = new Date().toISOString();
        const results = await Promise.all(
          conTel.map((r) => {
            const c = (r.conteo_recordatorios ?? 0) + 1;
            return supabase
              .from("invitados")
              .update({
                ultimo_recordatorio_at: now,
                conteo_recordatorios: c,
                canal_envio: "whatsapp",
              })
              .eq("id", r.id);
          })
        );
        const first = results.find((o) => o.error)?.error;
        if (first) {
          toast.error(supabaseErrorMessage(first), { duration: 5000 });
          return;
        }
        const items: WhatsappColaItem[] = conTel.map((r) => ({
          id: r.id,
          nombre: r.nombre_pasajero,
          href: buildWhatsappRecordatorioHref(r, origin, { target: waTarget })!,
        }));
        onWhatsappCola?.(items, { kind: "insistir", skippedSinTelefono: sinTel });
        if (sinTel > 0) {
          toast.message(
            sinTel === 1
              ? "A alguien le faltó un móvil: no pude ponerle el recordatorio. El resto, a insistir, abajo."
              : `A ${sinTel} les faltó móvil: no pude ponerles el recordatorio. El resto, abajo.`,
            { duration: 4500 }
          );
        }
        toast.success(
          conTel.length === 1
            ? "Listo el recordatorio en tu plan. Toca, abre el chat, con el mensaje hecho, abajo."
            : "Listo. Toca, abre, uno a uno, con el mensaje hecho en el recuadro.",
          { duration: 4000 }
        );
        refresh();
        return;
      }

      const canalReenvio: CanalEnvioInvitacion = canal;
      const ids = filas.map((r) => r.id);
      const errores: string[] = [];
      let ok = 0;
      for (const invitadoId of ids) {
        const res = await fetch("/api/invitaciones/enviar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitadoId, eventoId, canal: canalReenvio }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          errores.push(data.error ?? res.statusText);
        } else {
          ok += 1;
        }
      }
      if (ok > 0 && errores.length === 0) {
        toast.success(JX.reenviado(ids.length === 1), { duration: 3500 });
        refresh();
        return;
      }
      if (ok > 0 && errores.length > 0) {
        toast.warning(JX.envioConFallos(ok, errores.length), { duration: 5000 });
        toast.error(errores[0] ?? JX.errGenerico, { duration: 6000 });
        refresh();
        return;
      }
      toast.error(errores[0] ?? "No salió el recordatorio. Revisa e inténtalo otra vez.", { duration: 6000 });
    },
    [eventoId, canal, supabase, refresh, onWhatsappCola]
  );

  const enviarTodosPendientes = useCallback(
    async (rows: Invitado[]) => {
      if (!eventoId) {
        toast.error("Crea o elige un evento para avisar a tus invitados.", { duration: 4000 });
        return;
      }
      const filasPend = rows.filter((r) => deriveEstadoEnvio(r) === "pendiente");
      if (filasPend.length === 0) {
        toast.message(JX.colaVacia, { duration: 3000 });
        return;
      }
      setBusyScope("global");
      try {
        await enviarPendienteFilas(filasPend);
      } finally {
        setBusyScope(null);
      }
    },
    [eventoId, enviarPendienteFilas]
  );

  const enviarIds = useCallback(
    async (scope: BusyScope, filas: Invitado[]) => {
      if (!eventoId) return;
      const filasPend = filas.filter((r) => deriveEstadoEnvio(r) === "pendiente");
      if (filasPend.length === 0) {
        toast.message(JX.colaVaciaSeleccion, { duration: 3000 });
        return;
      }
      setBusyScope(scope);
      try {
        await enviarPendienteFilas(filasPend);
      } finally {
        setBusyScope(null);
      }
    },
    [eventoId, enviarPendienteFilas]
  );

  const reenviarFilas = useCallback(
    async (scope: BusyScope, filas: Invitado[]) => {
      if (!eventoId || filas.length === 0) return;
      setBusyScope(scope);
      try {
        await reenviarLote(filas);
      } finally {
        setBusyScope(null);
      }
    },
    [eventoId, reenviarLote]
  );

  return {
    busyScope,
    enviarTodosPendientes,
    /** Filas a enviar; internamente filtra a `estado` pendiente. */
    enviarIds,
    reenviarFilas,
  };
}
