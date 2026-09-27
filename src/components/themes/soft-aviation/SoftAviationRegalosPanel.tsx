"use client";

import { useAviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";
import { normalizeRegalosUrl, TEXTO_REGALOS_DEFAULT } from "@/lib/regalos-invitacion";
import type { ConfiguracionRegalosPublica } from "@/types/database";
import { ExternalLink } from "lucide-react";

type Props = {
  regalos: ConfiguracionRegalosPublica;
};

/**
 * Misma superficie / tipografía / CTA oro que Carta y RSVP (`SoftAviationPostalMotivo`, `SoftAviationGuestActions`).
 */
export function SoftAviationRegalosPanel({ regalos }: Props) {
  const variant = useAviationInvitacionVariant();
  const isJurnex = variant === "jurnex";
  const texto = regalos.texto_regalos?.trim() || TEXTO_REGALOS_DEFAULT;
  const url = normalizeRegalosUrl(regalos.url_regalos);
  const paragraphs = texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const primaryCtaClass = isJurnex
    ? "inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-inviteJurnex-gold px-5 py-3 text-center text-sm font-semibold text-inviteJurnex-navy shadow-sm transition hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inviteJurnex-navy/30 focus-visible:ring-offset-2"
    : "inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-invite-gold px-5 py-3 text-center text-sm font-semibold text-invite-navy shadow-sm transition hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-navy/30 focus-visible:ring-offset-2";

  return (
    <div className="animate-fadeIn px-0 py-2 sm:px-1 sm:py-4">
      <article
        className={
          isJurnex
            ? "relative mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-2xl border-2 border-inviteJurnex-navy/10 bg-white shadow-[0_18px_48px_-28px_rgba(2,24,42,0.36)] sm:rounded-[1.75rem] sm:shadow-[0_24px_70px_-32px_rgba(2,24,42,0.35)]"
            : "relative mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-invite-navy/10 bg-invite-paper shadow-[0_18px_48px_-28px_rgba(26,43,72,0.24)] sm:rounded-[1.75rem] sm:shadow-[0_20px_54px_-28px_rgba(26,43,72,0.24)]"
        }
        aria-labelledby="regalos-title"
      >
        <div
          className={isJurnex ? "h-1.5 bg-inviteJurnex-gold sm:h-2" : "h-1.5 bg-invite-gold sm:h-2"}
          aria-hidden
        />
        <div
          className={
            isJurnex
              ? "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-inviteJurnex-gold/18 blur-3xl"
              : "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-invite-gold/18 blur-3xl"
          }
          aria-hidden
        />
        <div
          className={
            isJurnex
              ? "pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-[#0d9488]/10 blur-3xl"
              : "pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-invite-navy/5 blur-3xl"
          }
          aria-hidden
        />

        <div className="relative z-10 p-4 sm:p-6">
          <p
            className={
              isJurnex
                ? "text-[10px] font-semibold uppercase tracking-[0.22em] text-inviteJurnex-navy/45"
                : "text-[10px] font-semibold uppercase tracking-[0.22em] text-invite-navy/45"
            }
          >
            Regalos
          </p>
          <h2
            id="regalos-title"
            className={
              isJurnex
                ? "mt-1 font-display text-[1.25rem] font-semibold leading-tight tracking-[-0.035em] text-inviteJurnex-navy sm:text-[1.45rem]"
                : "mt-1 font-inviteSerif text-[1.25rem] font-semibold leading-tight text-invite-navy sm:text-[1.45rem]"
            }
          >
            Tu presencia es nuestro mejor regalo
          </h2>

          <div
            className={
              isJurnex
                ? "mt-4 rounded-2xl border border-inviteJurnex-navy/8 bg-inviteJurnex-cream/65 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:mt-5 sm:p-4"
                : "mt-4 rounded-2xl border border-invite-navy/8 bg-white/70 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:mt-5 sm:p-4"
            }
          >
            <div
              className={
                isJurnex
                  ? "space-y-3 text-[15px] leading-[1.72] text-inviteJurnex-navy/90 sm:leading-[1.85]"
                  : "space-y-3 font-inviteSerif text-[16px] italic leading-[1.72] text-invite-navy/90 sm:leading-[1.85]"
              }
            >
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 12)}`} className="whitespace-pre-line break-words">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className={primaryCtaClass}>
                Abrir lista de regalos
                <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              </a>
            ) : (
              <p
                className={
                  isJurnex
                    ? "rounded-2xl border border-dashed border-inviteJurnex-navy/15 bg-white/80 px-3 py-4 text-center text-sm text-inviteJurnex-navy/60"
                    : "rounded-2xl border border-dashed border-invite-navy/15 bg-white/80 px-3 py-4 text-center text-sm text-invite-navy/60"
                }
              >
                Pronto compartiremos el enlace de regalos. Gracias por tu cariño.
              </p>
            )}
          </div>

          <div
            className={
              isJurnex
                ? "mt-4 flex items-center justify-between gap-3 border-t border-dashed border-inviteJurnex-navy/14 pt-3 sm:mt-5 sm:pt-4"
                : "mt-4 flex items-center justify-between gap-3 border-t border-dashed border-invite-navy/14 pt-3 sm:mt-5 sm:pt-4"
            }
          >
            <p
              className={
                isJurnex
                  ? "text-[9px] font-semibold uppercase tracking-[0.16em] text-inviteJurnex-navy/45 sm:text-[10px] sm:tracking-[0.22em]"
                  : "text-[9px] font-semibold uppercase tracking-[0.16em] text-invite-navy/45 sm:text-[10px] sm:tracking-[0.22em]"
              }
            >
              Con cariño
            </p>
            <p
              className={
                isJurnex
                  ? "rounded-full border border-inviteJurnex-gold/40 bg-inviteJurnex-gold/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-inviteJurnex-navy sm:px-3 sm:text-[10px] sm:tracking-[0.18em]"
                  : "rounded-full border border-invite-gold/40 bg-invite-gold/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-invite-navy sm:px-3 sm:text-[10px] sm:tracking-[0.18em]"
              }
            >
              Jurnex
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
