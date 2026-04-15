"use client";

import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/panel";
  return raw;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const nextPath = safeNextPath(searchParams.get("next"));
  const emailParam = searchParams.get("email");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePasswordLogin(e: React.FormEvent) {
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
    window.location.href = nextPath;
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setMessage("Indica tu correo para enviarte el enlace.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Revisa tu correo y abre el enlace para entrar.");
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
      <h1 className="font-display text-2xl font-bold text-white">Acceso</h1>
      <p className="mt-2 text-sm text-slate-400">
        Entra al panel de tu evento: invitados, invitación y regalos. Si administras la plataforma, usa el email
        configurado como administrador.
      </p>
      {(err || message) && (
        <p className="mt-4 rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">
          {message ?? "Error de autenticación"}
        </p>
      )}
      <form onSubmit={handlePasswordLogin} className="mt-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2"
          />
        </div>

        <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-4">
          <button
            type="button"
            disabled={loading || !email.trim()}
            onClick={() => void handleMagicLink()}
            className="w-full rounded-full bg-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-400 disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Continuar con enlace mágico"}
          </button>
          <p className="mt-2 text-center text-xs text-teal-100/90">
            Si no tienes contraseña, usa este método. Te enviamos un enlace seguro al correo.
          </p>
        </div>

        <div className="relative flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-wider text-slate-500">o con contraseña</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400">Contraseña</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full border border-white/20 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar con contraseña"}
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
