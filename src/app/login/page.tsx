"use client";

import { Button, Card, Input } from "@/components/jurnex-ui";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
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
    <Card className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold text-jurnex-text-primary">Acceso</h1>
      <p className="mt-2 text-sm text-jurnex-text-secondary">
        Entra al panel de tu evento: invitados, invitación y regalos. Si administras la plataforma, usa el email
        configurado como administrador.
      </p>
      {(err || message) && (
        <p className="mt-4 rounded-jurnex-sm border border-jurnex-warning/30 bg-jurnex-warning/10 px-3 py-2 text-sm text-jurnex-warning">
          {message ?? "Error de autenticación"}
        </p>
      )}
      <form onSubmit={handlePasswordLogin} className="mt-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-jurnex-text-secondary">Email</label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>

        <Card
          interactive={false}
          padded
          className="border-jurnex-primary/25 bg-jurnex-primary-soft shadow-none"
        >
          <Button
            type="button"
            disabled={loading || !email.trim()}
            onClick={() => void handleMagicLink()}
            className="w-full rounded-jurnex-md"
          >
            {loading ? "Enviando…" : "Continuar con enlace mágico"}
          </Button>
          <p className="mt-2 text-center text-xs text-jurnex-text-secondary">
            Si no tienes contraseña, usa este método. Te enviamos un enlace seguro al correo.
          </p>
        </Card>

        <div className="relative flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-jurnex-border" />
          <span className="text-[11px] uppercase tracking-wider text-jurnex-text-muted">o con contraseña</span>
          <span className="h-px flex-1 bg-jurnex-border" />
        </div>

        <div>
          <label className="block text-xs font-medium text-jurnex-text-secondary">Contraseña</label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={loading} variant="secondary" className="w-full rounded-jurnex-md">
          {loading ? "Entrando…" : "Entrar con contraseña"}
        </Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16">
        <Suspense fallback={<div className="text-jurnex-text-muted">Cargando…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
