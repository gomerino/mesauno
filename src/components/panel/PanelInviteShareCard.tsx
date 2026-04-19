"use client";

import { buildInvitationUrl } from "@/lib/invitation-url";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import { useMemo } from "react";

type Props = {
  /** Token del primer invitado válido (para el "ver pública" de muestra). */
  sampleToken: string | null;
  /** Nombre del primer invitado (para anclar el ejemplo). */
  sampleNombre: string | null;
  invitadosCount: number;
  invitacionesEnviadas: number;
};

function HeaderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M4 9h16" />
      <path d="M9 14h4" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PanelInviteShareCard({
  sampleToken,
  sampleNombre,
  invitadosCount,
  invitacionesEnviadas,
}: Props) {
  const publicUrl = useMemo(
    () => (sampleToken ? buildInvitationUrl(sampleToken) : null),
    [sampleToken]
  );

  const hasGuests = invitadosCount > 0 && Boolean(sampleToken);

  return (
    <section
      aria-label="Tu invitación"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-950/50 via-slate-900/60 to-indigo-950/40 p-4 shadow-sm md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10 text-sky-200">
            <HeaderIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
              Tu invitación
            </p>
            <h3 className="truncate text-sm font-semibold text-white md:text-base">
              {hasGuests ? "Lista para compartir" : "Aún no hay nadie a quien compartir"}
            </h3>
          </div>
        </div>
        {hasGuests && (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
            {invitacionesEnviadas > 0
              ? `${invitacionesEnviadas}/${invitadosCount} enviadas`
              : `${invitadosCount} invitado${invitadosCount === 1 ? "" : "s"}`}
          </span>
        )}
      </div>

      {hasGuests ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Cada invitado recibe un link único con su boarding pass. Previsualízalo antes de
            compartir para asegurar que todo se vea como esperas.
          </p>
          {sampleNombre && (
            <p className="mt-1 text-xs text-slate-400">
              Ejemplo de referencia: <span className="font-medium text-slate-200">{sampleNombre}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/panel/invitados/vista"
              onClick={() =>
                trackEvent("invite_cta_clicked", {
                  action: "preview",
                  source: "panel_home",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400"
            >
              <EyeIcon className="h-4 w-4 shrink-0" />
              Ver vista previa
            </Link>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("invite_cta_clicked", {
                    action: "open_public",
                    source: "panel_home",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                <ExternalIcon className="h-4 w-4 shrink-0" />
                Abrir pública
              </a>
            )}
            <Link
              href="/panel/invitados"
              onClick={() =>
                trackEvent("invite_cta_clicked", {
                  action: "manage_guests",
                  source: "panel_home",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-sky-200/90 transition hover:text-sky-100"
            >
              Copiar link por invitado →
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Cuando agregues al primer invitado vas a poder previsualizar su boarding pass y
            compartir el link único.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/panel/invitados?from=mission"
              onClick={() =>
                trackEvent("invite_cta_clicked", {
                  action: "add_guests",
                  source: "panel_home",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400"
            >
              Agregar invitado
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
