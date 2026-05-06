"use client";

import { Button, Input } from "@/components/jurnex-ui";
import { SiteHeader } from "@/components/SiteHeader";
import { getAuthEmailRedirectTo } from "@/lib/auth-email-redirect";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

const fieldStrong =
  "min-h-[48px] border-white/18 bg-black/50 text-[16px] text-white placeholder:text-slate-500 focus:border-teal-400/55 focus:ring-teal-400/25 sm:text-sm";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/panel";
  return raw;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const hintParam = searchParams.get("hint");
  const nextPath = safeNextPath(searchParams.get("next"));
  const emailParam = searchParams.get("email");
  const alertText = useMemo(() => {
    if (!err) return null;
    if (err === "auth") {
      if (hintParam) {
        try {
          return decodeURIComponent(hintParam);
        } catch {
          return hintParam;
        }
      }
      return "No pudimos completar el acceso. Intenta de nuevo o usa otro método.";
    }
    return err;
  }, [err, hintParam]);
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
    const emailRedirectTo = getAuthEmailRedirectTo(nextPath);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Revisa tu correo y abre el enlace para entrar.");
  }

  const banner = message ?? alertText;

  return (
    <div className="w-full max-w-[min(100%,26rem)] rounded-2xl border border-white/15 bg-[rgba(3,24,47,0.96)] p-4 shadow-[0_16px_56px_rgba(0,0,0,0.5)] ring-1 ring-teal-400/12 backdrop-blur-xl sm:max-w-md sm:p-7 md:p-8">
      <h1 className="font-display text-balance text-[1.65rem] font-bold leading-tight tracking-tight text-white sm:text-3xl">
        Acceso al panel
      </h1>
      <p className="mt-3 text-pretty text-[15px] leading-relaxed text-slate-300 sm:text-sm">
        Invitados, invitación y regalos. Si administras la plataforma, entra con el correo de administrador.
      </p>
      {banner ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-amber-400/35 bg-amber-950/55 px-3 py-3 text-[15px] leading-snug text-amber-50 sm:text-sm"
        >
          {banner}
        </p>
      ) : null}
      <form onSubmit={handlePasswordLogin} className="mt-6 space-y-5 sm:space-y-6">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-medium text-slate-200">
            Correo electrónico
          </label>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldStrong}
          />
        </div>

        {/* Enlace mágico: superficie oscura + texto gris alto contraste (no texto claro sobre beige). */}
        <div className="rounded-2xl border border-white/10 bg-black/45 p-4 sm:p-5">
          <p className="mb-3 text-[13px] font-medium text-slate-200">¿Sin contraseña?</p>
          <Button
            type="button"
            disabled={loading || !email.trim()}
            onClick={() => void handleMagicLink()}
            className="min-h-[48px] w-full rounded-xl px-4 text-[15px] font-semibold shadow-[0_0_28px_-6px_rgba(232,154,30,0.45)] sm:min-h-[44px] sm:text-sm"
          >
            {loading ? "Enviando…" : "Recibir enlace por correo"}
          </Button>
          <p className="mt-3 text-pretty text-center text-[13px] leading-relaxed text-slate-400 sm:text-xs">
            Te enviamos un enlace seguro. Revisa spam si no lo ves.
          </p>
        </div>

        <div className="relative flex items-center gap-3 py-0.5">
          <span className="h-px flex-1 bg-white/12" />
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">o</span>
          <span className="h-px flex-1 bg-white/12" />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-medium text-slate-200">
            Contraseña
          </label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldStrong}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          variant="secondary"
          className="min-h-[48px] w-full rounded-xl border border-white/18 bg-white/[0.08] text-[15px] text-white hover:border-teal-400/40 hover:bg-white/[0.12] sm:min-h-[44px] sm:text-sm"
        >
          {loading ? "Entrando…" : "Entrar con contraseña"}
        </Button>
      </form>
    </div>
  );
}

function LoginFallback() {
  return (
    <div
      className="mx-auto w-full max-w-[min(100%,26rem)] animate-pulse rounded-2xl border border-white/12 bg-[rgba(3,24,47,0.88)] p-6 shadow-[0_12px_48px_rgba(0,0,0,0.45)] sm:max-w-md sm:p-8"
      aria-busy
      aria-label="Cargando formulario"
    >
      <div className="h-8 w-3/4 rounded-lg bg-white/10" />
      <div className="mt-4 h-12 w-full rounded-xl bg-white/[0.06]" />
      <div className="mt-5 h-28 w-full rounded-2xl bg-black/30" />
      <div className="mt-5 h-12 w-full rounded-xl bg-white/[0.06]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-jurnex-bg">
      <div className="border-b border-white/12 bg-[#02182a]/92 backdrop-blur-md">
        <SiteHeader prominentLogo />
      </div>
      <main className="relative flex flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-10 sm:pt-10 md:pt-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-500/[0.1] via-transparent to-transparent sm:h-56"
          aria-hidden
        />
        <div className="relative z-[1] mx-auto flex w-full flex-1 flex-col items-center justify-start sm:justify-center">
          <Suspense fallback={<LoginFallback />}>
            <LoginForm />
          </Suspense>
          <p className="mt-8 max-w-sm text-center text-[12px] leading-relaxed text-slate-500 sm:mt-10">
            Al continuar, aceptas el uso seguro de tu correo solo para acceder a tu evento.
          </p>
        </div>
      </main>
    </div>
  );
}
