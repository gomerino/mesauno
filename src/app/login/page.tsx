"use client";

import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = "/panel";
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Revisa tu correo para el enlace de acceso.");
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
      <h1 className="font-display text-2xl font-bold text-white">Panel de novios</h1>
      <p className="mt-2 text-sm text-slate-400">
        Inicia sesión con email y contraseña (configura usuarios en Supabase Auth) o solicita un
        enlace mágico.
      </p>
      {(err || message) && (
        <p className="mt-4 rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">
          {message ?? "Error de autenticación"}
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-teal-500 py-3 font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <form onSubmit={handleMagicLink} className="mt-4">
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-full border border-white/20 py-3 text-sm text-teal-100 hover:bg-white/5 disabled:opacity-50"
        >
          Enviar enlace mágico
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16">
        <Suspense fallback={<div className="text-white">Cargando…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
