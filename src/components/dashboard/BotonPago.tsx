"use client";

import { createClient } from "@/lib/supabase/client";
import type { PricingPlanId } from "@/lib/pricing-plans";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  eventoId: string;
  className?: string;
  /** Plan de checkout (misma API que el banner del panel). Por defecto Experiencia. */
  plan?: PricingPlanId;
};

function readBypassFromLocation(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search);
  const b = p.get("bypass");
  return b === "1" || b?.toLowerCase() === "true" || b?.toLowerCase() === "yes";
}

export function BotonPago({ eventoId, className, plan = "experiencia" }: Props) {
  const [loading, setLoading] = useState(false);

  async function irAPagar() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email?.trim().toLowerCase() ?? "";
      let nombre = (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "")
        .trim();
      if (nombre.length < 2 && email) {
        const local = email.split("@")[0] ?? "";
        if (local.length >= 2) nombre = local;
      }
      if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Necesitamos tu nombre y un email válido en la cuenta.");
        return;
      }

      const fromUrl = readBypassFromLocation();
      const qs = fromUrl ? "?bypass=1" : "";
      const res = await fetch(`/api/checkout${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          evento_id: eventoId,
          nombre,
          email,
          ...(fromUrl ? { bypass: true } : {}),
        }),
      });
      const data = (await res.json()) as { init_point?: string; error?: string; detail?: string; hint?: string };
      if (!res.ok) {
        const parts = [data.error, data.detail, data.hint].filter(Boolean);
        toast.error(parts.length ? parts.join(" ") : "No se pudo iniciar el pago");
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
      {loading ? "Abriendo Mercado Pago…" : "Activar suscripción"}
    </button>
  );
}
