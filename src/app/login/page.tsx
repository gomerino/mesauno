"use client";

import {
  OtpInput,
  OTP_LENGTH_MAX,
  OTP_LENGTH_MIN,
  otpTieneLongitudValida,
  sanitizeOtpDigits,
} from "@/components/auth/OtpInput";
import { Button, Card, Input } from "@/components/jurnex-ui";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";

const fieldStrong =
  "min-h-[48px] border-white/18 bg-black/50 text-[16px] text-white placeholder:text-slate-500 focus:border-teal-400/55 focus:ring-teal-400/25 sm:text-sm";

const RESEND_COOLDOWN_SEC = 60;

function otpSendErrorMessage(rawMessage: string): string {
  const raw = rawMessage.toLowerCase();
  const isRateLimited =
    raw.includes("rate") ||
    raw.includes("429") ||
    raw.includes("too many") ||
    raw.includes("security purposes") ||
    raw.includes("once every") ||
    raw.includes("seconds");

  if (isRateLimited) {
    return "Espera un minuto antes de reenviar el código.";
  }

  if (raw.includes("invalid email") || raw.includes("email address")) {
    return "El correo no es válido. Revísalo e inténtalo de nuevo.";
  }

  return "No pudimos enviar el código. Revisa el correo e inténtalo de nuevo.";
}

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
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [step, setStep] = useState<"email" | "otp">("email");
  const [otpCode, setOtpCode] = useState("");
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [emailStepMessage, setEmailStepMessage] = useState<string | null>(null);
  const [otpBanner, setOtpBanner] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [otpFieldError, setOtpFieldError] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const sendLockRef = useRef(false);
  const verifyLockRef = useRef(false);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = window.setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldownLeft]);

  function redirectAfterSession() {
    window.location.href = `/auth/post-login?next=${encodeURIComponent(nextPath)}`;
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPasswordLoading(false);
    if (error) {
      setPasswordMessage(error.message);
      return;
    }
    redirectAfterSession();
  }

  async function sendOtpCode(options?: { stayOnOtpStep?: boolean }) {
    const stay = options?.stayOnOtpStep ?? false;
    if (!email.trim()) {
      setEmailStepMessage("Indica tu correo para enviarte el código.");
      return;
    }
    if (sendLockRef.current || otpSendLoading) return;
    sendLockRef.current = true;
    setOtpSendLoading(true);
    setEmailStepMessage(null);
    setOtpBanner(null);
    setOtpFieldError(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });

    setOtpSendLoading(false);
    sendLockRef.current = false;

    if (error) {
      const msg = otpSendErrorMessage(error.message ?? "");
      if (stay) setOtpBanner(msg);
      else setEmailStepMessage(msg);
      return;
    }

    setCooldownLeft(RESEND_COOLDOWN_SEC);
    setOtpCode("");
    setOtpFieldError(false);
    if (!stay) {
      setStep("otp");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const token = sanitizeOtpDigits(otpCode, OTP_LENGTH_MAX);
    if (!otpTieneLongitudValida(token, OTP_LENGTH_MIN)) {
      setOtpBanner(`Ingresa al menos ${OTP_LENGTH_MIN} dígitos del código.`);
      setOtpFieldError(true);
      return;
    }
    if (verifyLockRef.current || otpVerifyLoading) return;
    verifyLockRef.current = true;
    setOtpVerifyLoading(true);
    setOtpBanner(null);
    setOtpFieldError(false);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });

    setOtpVerifyLoading(false);
    verifyLockRef.current = false;

    if (error) {
      setOtpBanner("El código no es válido o expiró");
      setOtpFieldError(true);
      return;
    }

    redirectAfterSession();
  }

  const showTopBanner = alertText;
  const showEmailBanner = step === "email" && emailStepMessage;

  return (
    <div className="w-full max-w-[min(100%,26rem)] rounded-2xl border border-white/15 bg-[rgba(3,24,47,0.96)] p-4 shadow-[0_16px_56px_rgba(0,0,0,0.5)] ring-1 ring-teal-400/12 backdrop-blur-xl sm:max-w-md sm:p-7 md:p-8">
      <h1 className="font-display text-balance text-[1.65rem] font-bold leading-tight tracking-tight text-white sm:text-3xl">
        Acceso al panel
      </h1>
      <p className="mt-3 text-pretty text-[15px] leading-relaxed text-slate-300 sm:text-sm">
        Invitados, invitación y regalos. Si administras la plataforma, entra con el correo de administrador.
      </p>

      {showTopBanner ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-amber-400/35 bg-amber-950/55 px-3 py-3 text-[15px] leading-snug text-amber-50 sm:text-sm"
        >
          {showTopBanner}
        </p>
      ) : null}

      {step === "email" ? (
        <div className="mt-6 space-y-5">
          <p className="text-center text-[15px] font-medium leading-snug text-teal-100/95 sm:text-sm">
            Te enviaremos un código para abordar ✈️
          </p>
          {showEmailBanner ? (
            <p
              role="alert"
              className="rounded-xl border border-amber-400/35 bg-amber-950/55 px-3 py-3 text-[15px] leading-snug text-amber-50 sm:text-sm"
            >
              {emailStepMessage}
            </p>
          ) : null}
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
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailStepMessage(null);
              }}
              className={fieldStrong}
            />
          </div>
          <Button
            type="button"
            disabled={otpSendLoading || !email.trim()}
            onClick={() => void sendOtpCode()}
            className="min-h-[48px] w-full rounded-xl px-4 text-[15px] font-semibold shadow-[0_0_28px_-6px_rgba(232,154,30,0.45)] sm:min-h-[44px] sm:text-sm"
          >
            {otpSendLoading ? "Enviando…" : "Enviar código"}
          </Button>
          <p className="text-pretty text-center text-[13px] leading-relaxed text-slate-400 sm:text-xs">
            Revisa también spam o promociones. El código caduca en unos minutos.
          </p>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={(e) => void handleVerifyOtp(e)}>
          {otpBanner ? (
            <p
              role="alert"
              className="rounded-xl border border-amber-400/35 bg-amber-950/55 px-3 py-3 text-[15px] leading-snug text-amber-50 sm:text-sm"
            >
              {otpBanner}
            </p>
          ) : null}

          <div className="space-y-1">
            <h2 className="text-center font-display text-[1.25rem] font-bold leading-snug text-white sm:text-xl">
              Ingresa tu código ✈️
            </h2>
            <p className="text-center text-[14px] leading-relaxed text-slate-300 sm:text-sm">
              Te enviamos un código a tu correo
            </p>
            <p className="text-center text-[13px] text-slate-400">{email.trim()}</p>
          </div>

          <Card interactive={false} padded className="mt-1 border-white/12 bg-black/35">
            <OtpInput
              id="login-otp"
              value={otpCode}
              onChange={(next) => {
                setOtpCode(next);
                setOtpFieldError(false);
              }}
              disabled={otpVerifyLoading}
              invalid={otpFieldError}
              autoFocus
              lengthMin={OTP_LENGTH_MIN}
            />
          </Card>

          <Button
            type="submit"
            disabled={otpVerifyLoading || !otpTieneLongitudValida(otpCode, OTP_LENGTH_MIN)}
            className="min-h-[48px] w-full rounded-xl px-4 text-[15px] font-semibold shadow-[0_0_28px_-6px_rgba(232,154,30,0.45)] sm:min-h-[44px] sm:text-sm"
          >
            {otpVerifyLoading ? "Validando…" : "Continuar"}
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={otpSendLoading || cooldownLeft > 0}
              onClick={() => void sendOtpCode({ stayOnOtpStep: true })}
              className="min-h-[44px] w-full rounded-xl border border-white/18 bg-white/[0.06] text-[14px] text-white hover:border-teal-400/35 hover:bg-white/[0.1] sm:flex-1 sm:text-sm"
            >
              {otpSendLoading ? "Enviando…" : cooldownLeft > 0 ? `Reenviar código (${cooldownLeft}s)` : "Reenviar código"}
            </Button>
            <button
              type="button"
              className="w-full py-2 text-center text-[13px] font-medium text-teal-200/95 underline-offset-2 hover:text-white hover:underline sm:flex-1 sm:py-0"
              onClick={() => {
                setStep("email");
                setOtpBanner(null);
                setEmailStepMessage(null);
                setOtpFieldError(false);
                setOtpCode("");
              }}
            >
              Cambiar correo
            </button>
          </div>
        </form>
      )}

      <div className="relative flex items-center gap-3 py-6">
        <span className="h-px flex-1 bg-white/12" />
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">o</span>
        <span className="h-px flex-1 bg-white/12" />
      </div>

      <form onSubmit={handlePasswordLogin} className="space-y-5 sm:space-y-6">
        {passwordMessage ? (
          <p
            role="alert"
            className="rounded-xl border border-amber-400/35 bg-amber-950/55 px-3 py-3 text-[15px] leading-snug text-amber-50 sm:text-sm"
          >
            {passwordMessage}
          </p>
        ) : null}
        <div>
          <label htmlFor="login-email-pw" className="mb-1.5 block text-[13px] font-medium text-slate-200">
            Correo electrónico
          </label>
          <Input
            id="login-email-pw"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPasswordMessage(null);
            }}
            className={fieldStrong}
          />
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
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordMessage(null);
            }}
            className={fieldStrong}
          />
        </div>
        <Button
          type="submit"
          disabled={passwordLoading}
          variant="secondary"
          className="min-h-[48px] w-full rounded-xl border border-white/18 bg-white/[0.08] text-[15px] text-white hover:border-teal-400/40 hover:bg-white/[0.12] sm:min-h-[44px] sm:text-sm"
        >
          {passwordLoading ? "Entrando…" : "Entrar con contraseña"}
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
