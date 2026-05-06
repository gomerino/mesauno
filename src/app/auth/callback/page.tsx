"use client";

import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const VERIFY_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_REF = (() => {
  try {
    return new URL(SUPABASE_URL).host.split(".")[0] ?? "";
  } catch {
    return "";
  }
})();
const STORAGE_KEY = SUPABASE_REF ? `sb-${SUPABASE_REF}-auth-token` : "";

function readCookieMap(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof document === "undefined") return out;
  document.cookie.split(";").forEach((part) => {
    const [name, ...v] = part.trim().split("=");
    if (!name) return;
    out[name] = v.join("=");
  });
  return out;
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const nextRaw = searchParams.get("next");
  const [status, setStatus] = useState("Completando acceso…");

  useEffect(() => {
    const origin = window.location.origin;
    const nextQuery = nextRaw ? `?next=${encodeURIComponent(nextRaw)}` : "";

    const run = async () => {
      const fail = (message: string) => {
        const hint =
          process.env.NODE_ENV === "development"
            ? `&hint=${encodeURIComponent(message)}`
            : "";
        window.location.replace(`${origin}/login?error=auth${hint}`);
      };

      try {
        const qs = new URLSearchParams(window.location.search);
        if (qs.get("error")) {
          fail(qs.get("error_description") ?? "Error devuelto por el proveedor de acceso.");
          return;
        }

        // Diagnóstico ANTES de instanciar el cliente: createBrowserClient ejecuta
        // initialize() y, si encuentra ?code=, intenta el intercambio PKCE de inmediato
        // y borra el code-verifier de cookies (también en caso de error). Por eso hay que
        // mirar las cookies antes de construir el cliente.
        if (code && !token_hash) {
          const cookies = readCookieMap();
          const verifierCookie = STORAGE_KEY
            ? cookies[`${STORAGE_KEY}-code-verifier`]
            : undefined;

          if (process.env.NODE_ENV === "development") {
            console.info(
              "[auth/callback] cookies sb-* presentes:",
              Object.keys(cookies).filter((n) => n.startsWith("sb-")),
              "verifierCookie?",
              Boolean(verifierCookie),
              "storageKey:",
              STORAGE_KEY
            );
          }

          if (!verifierCookie) {
            fail(
              "No encontramos el verificador PKCE en este navegador. Esto pasa cuando: (a) el correo se abrió en otro navegador o perfil distinto al que pidió el enlace, (b) un escáner de correo (Outlook, Microsoft Defender) precargó el link y consumió el código, o (c) borraste cookies. Pide un enlace nuevo desde /login y ábrelo en el MISMO navegador donde lo solicitaste."
            );
            return;
          }
        }

        const supabase = createClient();

        if (token_hash && otpType && VERIFY_OTP_TYPES.has(otpType)) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: otpType as EmailOtpType,
          });
          if (error) {
            console.error("[auth/callback] verifyOtp:", error.message);
            fail(error.message);
            return;
          }
        } else if (code) {
          // initialize() del cliente ya intercambia ?code= si hay verifier en cookies.
          // Solo confirmamos que la sesión quedó guardada.
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            fail(
              "No se pudo completar el acceso con este enlace. Puede estar expirado o ya usado. Pide uno nuevo desde /login."
            );
            return;
          }
        } else {
          fail("Faltan parámetros de autenticación en la URL.");
          return;
        }

        setStatus("Redirigiendo…");
        window.location.replace(`${origin}/auth/post-login${nextQuery}`);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error de autenticación";
        fail(message);
      }
    };

    void run();
  }, [code, token_hash, otpType, nextRaw]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center text-slate-200">
      <p className="text-sm">{status}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-slate-400">Cargando…</div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
