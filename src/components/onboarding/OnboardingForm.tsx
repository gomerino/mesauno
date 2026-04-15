"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function randomFlightCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function randomPassword(): string {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function OnboardingForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombreNovio1, setNombreNovio1] = useState("");
  const [nombreNovio2, setNombreNovio2] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim().toLowerCase();
    const n1 = nombreNovio1.trim();
    const n2 = nombreNovio2.trim();
    const fecha = fechaEvento.trim();

    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Necesitamos un correo válido.");
      return;
    }
    if (n1.length < 1 || n2.length < 1) {
      setError("Escribí el nombre de ambos novios.");
      return;
    }
    if (!fecha) {
      setError("Elegí la fecha del evento.");
      return;
    }

    setBusy(true);
    try {
      const password = randomPassword();
      const display = `${n1} & ${n2}`;

      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email: em,
        password,
        options: {
          data: {
            nombre_novio_1: n1,
            nombre_novio_2: n2,
            full_name: display,
          },
        },
      });

      if (signErr) {
        const msg = signErr.message?.toLowerCase() ?? "";
        if (msg.includes("already") || msg.includes("registered")) {
          router.push(`/login?next=${encodeURIComponent("/panel")}&email=${encodeURIComponent(em)}`);
          return;
        }
        setError(signErr.message || "No se pudo crear la cuenta.");
        return;
      }

      if (!signData.session) {
        setError(
          "Tenés que confirmar el correo antes de seguir. Revisá tu bandeja (y el spam) y volvé a entrar."
        );
        return;
      }

      const { error: insErr } = await supabase.from("eventos").insert({
        nombre_novio_1: n1,
        nombre_novio_2: n2,
        fecha_boda: fecha,
        fecha_evento: fecha,
        nombre_evento: `Boda ${display}`,
        destino: "Destino por confirmar",
        codigo_vuelo: randomFlightCode(),
        hora_embarque: "17:30",
        puerta: "B",
        asiento_default: "12A",
        lugar_evento_linea: "Lugar por confirmar",
        plan_status: "trial",
        recordatorios_activos: false,
      });

      if (insErr) {
        console.error("[onboarding] insert evento", insErr);
        setError("Tu cuenta quedó creada, pero no pudimos crear el evento. Probá en el panel.");
        router.push("/panel");
        router.refresh();
        return;
      }

      router.push("/panel");
      router.refresh();
    } catch {
      setError("Algo salió mal. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm"
    >
      <div>
        <label htmlFor="ob_email" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Email <span className="text-rose-400">*</span>
        </label>
        <input
          id="ob_email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
          placeholder="tu@correo.cl"
        />
      </div>
      <div>
        <label htmlFor="ob_n1" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Nombre novio/a 1 <span className="text-rose-400">*</span>
        </label>
        <input
          id="ob_n1"
          name="nombre_novio_1"
          type="text"
          autoComplete="given-name"
          required
          value={nombreNovio1}
          onChange={(e) => setNombreNovio1(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
          placeholder="ej. Camila"
        />
      </div>
      <div>
        <label htmlFor="ob_n2" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Nombre novio/a 2 <span className="text-rose-400">*</span>
        </label>
        <input
          id="ob_n2"
          name="nombre_novio_2"
          type="text"
          autoComplete="given-name"
          required
          value={nombreNovio2}
          onChange={(e) => setNombreNovio2(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
          placeholder="ej. Diego"
        />
      </div>
      <div>
        <label htmlFor="ob_fecha" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">
          Fecha del evento <span className="text-rose-400">*</span>
        </label>
        <input
          id="ob_fecha"
          name="fecha_evento"
          type="date"
          required
          value={fechaEvento}
          onChange={(e) => setFechaEvento(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f172a]/80 px-4 py-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3 text-sm font-semibold text-[#0f172a] transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Creando tu viaje…" : "Crear mi viaje ✈️"}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-slate-500">
        Si cerrás sesión, podés volver a entrar con “Olvidé mi contraseña” usando este correo.
      </p>
    </form>
  );
}
