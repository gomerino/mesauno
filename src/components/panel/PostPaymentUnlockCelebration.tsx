"use client";

import { trackEvent } from "@/lib/analytics";
import {
  JURNEX_JUST_UNLOCKED_KEY,
  unlockCelebrationStorageKey,
} from "@/lib/unlock-celebration";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

const CELEBRATION_MS = 1800;

type Props = {
  paymentId: string | null;
};

/**
 * Microceremonia post-pago (JUR-28): candado → ✦ dorado con burst y glow.
 * Corre como máximo una vez por `paymentId` (o clave genérica si no hay id).
 */
export function PostPaymentUnlockCelebration({ paymentId }: Props) {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const key = unlockCelebrationStorageKey(paymentId);

    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduced);

    try {
      sessionStorage.setItem(JURNEX_JUST_UNLOCKED_KEY, "1");
    } catch {
      /* ignore */
    }

    const startedAt = performance.now();
    setVisible(true);

    const duration = reduced ? 80 : CELEBRATION_MS;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      try {
        localStorage.setItem(key, String(Date.now()));
        localStorage.removeItem(JURNEX_JUST_UNLOCKED_KEY);
      } catch {
        /* ignore */
      }
      trackEvent("phase_unlocked_celebration_shown", {
        duration_ms: Math.round(performance.now() - startedAt),
      });
      setVisible(false);
    }, duration);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [paymentId]);

  if (!visible) return null;

  const sparkles = [
    { className: "left-[8%] top-[18%]", delay: "0ms" },
    { className: "right-[12%] top-[22%]", delay: "80ms" },
    { className: "left-[18%] bottom-[24%]", delay: "120ms" },
    { className: "right-[20%] bottom-[18%]", delay: "200ms" },
    { className: "left-[42%] top-[4%]", delay: "160ms" },
    { className: "right-[38%] bottom-[8%]", delay: "240ms" },
    { className: "left-[2%] top-[48%]", delay: "100ms" },
    { className: "right-[4%] top-[52%]", delay: "180ms" },
  ];

  return (
    <div
      className="fixed inset-0 z-[700] flex animate-fadeIn items-center justify-center bg-black/50 backdrop-blur-[2px]"
      role="presentation"
      aria-hidden
    >
      <div className="relative flex h-56 w-56 items-center justify-center md:h-64 md:w-64">
        {!reducedMotion ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.35)_0%,transparent_65%)] animate-unlockGlowOnce"
              aria-hidden
            />
            {sparkles.map((s, i) => (
              <span
                key={i}
                className={`pointer-events-none absolute h-2 w-2 animate-unlockParticle rounded-full bg-[#E8C547] shadow-[0_0_8px_rgba(212,175,55,0.8)] ${s.className}`}
                style={{ animationDelay: s.delay }}
                aria-hidden
              />
            ))}
            <Lock
              className="absolute h-14 w-14 animate-unlockLockExit text-[#D4AF37]"
              strokeWidth={2}
              aria-hidden
            />
          </>
        ) : null}

        <span
          className={`relative z-10 font-display text-6xl leading-none text-[#D4AF37] drop-shadow-[0_0_24px_rgba(212,175,55,0.55)] ${
            reducedMotion ? "scale-100 rotate-180 opacity-100" : "animate-unlockSparkleIn"
          }`}
          aria-hidden
        >
          ✦
        </span>
      </div>
    </div>
  );
}
