"use client";

import Link from "next/link";

export type PanelPostPaymentSuccessProps = {
  invitadosCount: number;
  planKind: "esencial" | "experiencia";
  paymentId: string | null;
  montoPago: number | null;
};

function formatMonto(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export function PanelPostPaymentSuccess({
  invitadosCount,
  planKind,
  paymentId,
  montoPago,
}: PanelPostPaymentSuccessProps) {
  const planLine =
    planKind === "esencial" ? "✔ Plan Esencial activado" : "✔ Plan Experiencia activado";

  const primaryHref = invitadosCount === 0 ? "/panel/invitados" : "/panel/invitacion";
  const primaryLabel =
    invitadosCount === 0 ? "👥 Cargar pasajeros" : "🚀 Enviar primeras invitaciones";

  const secondaries = [
    { emoji: "🎵", label: "Activar música", href: "/panel/experiencia" },
    { emoji: "📸", label: "Ver álbum", href: "/panel/experiencia" },
    { emoji: "✉️", label: "Personalizar invitación", href: "/panel/invitacion" },
  ] as const;

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-8 md:max-w-2xl md:pb-12">
      <header className="motion-safe:animate-postPayReveal motion-safe:[animation-delay:40ms] motion-reduce:animate-none motion-reduce:opacity-100">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/90">Listo</p>
        <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
          Tu viaje acaba de despegar ✈️
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-200 sm:text-lg">
          Ya desbloqueaste la experiencia completa para tus invitados
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Todo está listo para comenzar a crear momentos inolvidables
        </p>
      </header>

      <div className="motion-safe:animate-postPayReveal motion-safe:[animation-delay:100ms] motion-reduce:animate-none motion-reduce:opacity-100 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 sm:px-5">
        <p className="text-sm font-medium text-emerald-400/95">{planLine}</p>
        <p className="text-xs text-slate-500">Pago confirmado con Mercado Pago</p>
      </div>

      <section className="motion-safe:animate-postPayReveal motion-safe:[animation-delay:160ms] motion-reduce:animate-none motion-reduce:opacity-100 rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0c101c] to-[#0a0e16] p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]">
        <h2 className="font-display text-base font-semibold text-white">Tus invitados ahora pueden</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
          <li className="flex gap-2">
            <span className="text-[#D4AF37]" aria-hidden>
              ·
            </span>
            Recibir su invitación digital
          </li>
          <li className="flex gap-2">
            <span className="text-[#D4AF37]" aria-hidden>
              ·
            </span>
            Subir fotos al álbum
          </li>
          <li className="flex gap-2">
            <span className="text-[#D4AF37]" aria-hidden>
              ·
            </span>
            Participar en la música del evento
          </li>
        </ul>
      </section>

      <div className="motion-safe:animate-postPayReveal motion-safe:[animation-delay:220ms] motion-reduce:animate-none motion-reduce:opacity-100">
        <Link
          href={primaryHref}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#e0c356] via-[#D4AF37] to-[#b8941f] px-6 text-sm font-semibold text-[#0f172a] shadow-[0_6px_28px_-6px_rgba(212,175,55,0.45)] ring-1 ring-yellow-300/30 transition hover:brightness-[1.06] active:scale-[0.99]"
        >
          {primaryLabel}
        </Link>
      </div>

      <div className="motion-safe:animate-postPayReveal motion-safe:[animation-delay:280ms] motion-reduce:animate-none motion-reduce:opacity-100 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {secondaries.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-center text-xs font-medium text-slate-300 transition hover:border-[#D4AF37]/25 hover:bg-white/[0.05] hover:text-white"
          >
            <span aria-hidden>{s.emoji}</span>
            {s.label}
          </Link>
        ))}
      </div>

      <details className="motion-safe:animate-postPayReveal motion-safe:[animation-delay:340ms] motion-reduce:animate-none motion-reduce:opacity-100 group rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-slate-400 transition group-open:text-slate-200 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            Ver detalle del pago
            <span className="text-slate-600 transition group-open:rotate-180">▾</span>
          </span>
        </summary>
        <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-sm text-slate-400">
          {paymentId ? (
            <p>
              <span className="text-slate-500">ID de pago: </span>
              <span className="font-mono text-xs text-slate-300">{paymentId}</span>
            </p>
          ) : null}
          {montoPago != null && Number.isFinite(montoPago) ? (
            <p>
              <span className="text-slate-500">Monto: </span>
              {formatMonto(montoPago)} CLP
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-slate-500">
            Procesado de forma segura con Mercado Pago. Guarda este comprobante si lo necesitas para tu contabilidad.
          </p>
        </div>
      </details>
    </div>
  );
}
