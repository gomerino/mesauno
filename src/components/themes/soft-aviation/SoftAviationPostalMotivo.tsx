"use client";

import { useAviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";

type Props = {
  motivoText: string;
};

/**
 * Carta editorial del motivo: lectura cálida, superficie premium y sello de marca.
 */
export function SoftAviationPostalMotivo({ motivoText }: Props) {
  const variant = useAviationInvitacionVariant();
  const isJurnex = variant === "jurnex";
  const body =
    motivoText.trim().length > 0
      ? motivoText
      : "Con todo el cariño, esperamos compartir este día inolvidable contigo.";
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="animate-fadeIn px-0 py-2 sm:px-1 sm:py-4">
      <article
        className={
          isJurnex
            ? "relative mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-2xl border-2 border-inviteJurnex-navy/10 bg-white shadow-[0_18px_48px_-28px_rgba(2,24,42,0.36)] sm:rounded-[1.75rem] sm:shadow-[0_24px_70px_-32px_rgba(2,24,42,0.35)]"
            : "relative mx-auto w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-invite-navy/10 bg-invite-paper shadow-[0_18px_48px_-28px_rgba(26,43,72,0.24)] sm:rounded-[1.75rem] sm:shadow-[0_20px_54px_-28px_rgba(26,43,72,0.24)]"
        }
        aria-labelledby="motivo-viaje-title"
      >
        <div
          className={
            isJurnex
              ? "h-1.5 bg-inviteJurnex-gold sm:h-2"
              : "h-1.5 bg-invite-gold sm:h-2"
          }
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
          <div>
            <div className="min-w-0">
              <h2
                id="motivo-viaje-title"
                className={
                  isJurnex
                    ? "font-display text-[1.25rem] font-semibold leading-tight tracking-[-0.035em] text-inviteJurnex-navy sm:text-[1.45rem]"
                    : "font-inviteSerif text-[1.25rem] font-semibold leading-tight text-invite-navy sm:text-[1.45rem]"
                }
              >
                Carta de viaje
              </h2>
            </div>
          </div>

          <div
            className={
              isJurnex
                ? "mt-4 rounded-2xl border border-inviteJurnex-navy/8 bg-inviteJurnex-cream/65 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:mt-5 sm:p-4"
                : "mt-4 rounded-2xl border border-invite-navy/8 bg-white/70 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:mt-5 sm:p-4"
            }
          >
            <span
              className={
                isJurnex
                  ? "mb-1 block font-display text-3xl font-semibold leading-none text-inviteJurnex-gold/70 sm:float-left sm:mb-0 sm:mr-3 sm:mt-1 sm:text-5xl sm:leading-[0.8]"
                  : "mb-1 block font-inviteSerif text-3xl font-semibold leading-none text-invite-gold/70 sm:float-left sm:mb-0 sm:mr-3 sm:mt-1 sm:text-5xl sm:leading-[0.8]"
              }
              aria-hidden
            >
              “
            </span>
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
              Manifiesto emocional
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
