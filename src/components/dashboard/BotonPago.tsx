"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = {
  eventoId: string;
  className?: string;
};

export function BotonPago({ eventoId, className }: Props) {
  const [loading, setLoading] = useState(false);

  async function irAPagar() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento_id: eventoId }),
      });
      const data = (await res.json()) as { init_point?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo iniciar el pago");
        return;
      }
      if (!data.init_point) {
        toast.error("Respuesta inválida del servidor");
        return;
      }
      window.location.href = data.init_point;
    } catch {
      toast.error("Error de red al contactar el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void irAPagar()}
      className={
        className ??
        "rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-900/20 disabled:opacity-60"
      }
    >
      {loading ? "Abriendo checkout…" : "Activar suscripción"}
    </button>
  );
}
