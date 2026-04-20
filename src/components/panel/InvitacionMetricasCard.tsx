"use client";

import { sendInvitationsFromPanelAction } from "@/app/panel/invitaciones-actions";
import { Button } from "@/components/jurnex-ui";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Props = {
  eventoId: string;
  totalInvitados: number;
  emailsEnviados: number;
  /**
   * Invitados con `invitacion_vista` y correo enviado desde Jurnex (`email_enviado`).
   * Es el numerador coherente con “cuántos abrieron entre quienes recibieron correo”.
   */
  abrieronTrasCorreo: number;
  /**
   * Vieron la invitación pero no tienen correo enviado desde aquí (enlace o WhatsApp compartido, pruebas, etc.).
   */
  vistasSinCorreoDesdePanel: number;
  /** Dentro del acordeón «Correo y seguimiento»: oculta el título duplicado. */
  embedded?: boolean;
  /** Menos espacio vertical (sidebar / layout denso). */
  compactSpacing?: boolean;
  /** Sidebar secundario: menos peso visual que el bloque principal. */
  subdued?: boolean;
};

export function InvitacionMetricasCard({
  eventoId,
  totalInvitados,
  emailsEnviados,
  abrieronTrasCorreo,
  vistasSinCorreoDesdePanel,
  embedded = false,
  compactSpacing = false,
  subdued = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const tasaPctBruta =
    emailsEnviados > 0 ? (abrieronTrasCorreo / emailsEnviados) * 100 : 0;
  const tasaPct = Math.min(100, Math.round(tasaPctBruta * 10) / 10);

  async function run(mode: "unsent" | "pending_rsvp") {
    const t = toast.loading(
      mode === "unsent" ? "Enviando invitaciones…" : "Reenviando confirmaciones…",
      { duration: 60_000 }
    );
    startTransition(async () => {
      try {
        const res = await sendInvitationsFromPanelAction(eventoId, mode);
        toast.dismiss(t);
        if (!res.ok) {
          toast.error(res.error, { duration: 4000 });
          return;
        }
        const extra =
          res.errors.length > 0 ? ` · Avisos: ${res.errors.slice(0, 2).join("; ")}` : "";
        toast.success(
          `${res.sent} invitaciones enviadas${res.skipped ? ` · ${res.skipped} omitidas` : ""}${extra}`,
          { duration: 4000 }
        );
        router.refresh();
      } catch {
        toast.dismiss(t);
        toast.error("No se pudo completar el envío. Intenta nuevamente.", { duration: 4000 });
      }
    });
  }

  const pad = compactSpacing
    ? embedded
      ? "p-3 sm:p-4"
      : "p-4 sm:p-5"
    : embedded
      ? "p-5 sm:p-6"
      : "p-6 sm:p-7";

  const outer = subdued
    ? `rounded-jurnex-md border border-jurnex-border/45 bg-jurnex-bg/50 backdrop-blur-sm relative overflow-hidden ${pad}`
    : `rounded-jurnex-md border border-jurnex-border bg-jurnex-surface/90 backdrop-blur-xl shadow-jurnex-card shadow-jurnex-glow relative overflow-hidden ${pad}`;

  return (
    <div className={outer}>
      <div
        className={`pointer-events-none absolute -left-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-jurnex-primary/10 blur-3xl ${subdued ? "opacity-25" : ""}`}
      />
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-jurnex-secondary/15 blur-2xl ${subdued ? "opacity-25" : ""}`}
      />

      <div className="relative">
        {!embedded ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-jurnex-secondary/90">
              Seguimiento
            </p>
            <h2 className="font-display mt-2 text-xl font-bold text-jurnex-text-primary sm:text-2xl">
              Correos e invitación
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-jurnex-text-secondary">
              Las cifras de apertura cuentan solo invitados a quienes enviaste la invitación por correo
              desde aquí. Si alguien abre por WhatsApp o enlace sin ese envío, lo mostramos aparte.
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-jurnex-text-muted">
            Las cifras de apertura son sobre correos enviados desde aquí; las aperturas solo por enlace o
            WhatsApp se indican abajo si aplican.
          </p>
        )}

        <div
          className={`grid sm:grid-cols-3 ${compactSpacing ? "gap-2" : "gap-3"} ${embedded ? (compactSpacing ? "mt-3" : "mt-4") : compactSpacing ? "mt-4" : "mt-6"}`}
        >
          <div
            className={`rounded-jurnex-md border border-jurnex-border bg-jurnex-surface/80 shadow-inner backdrop-blur-sm ${compactSpacing ? "px-3 py-2" : "px-4 py-4"}`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-jurnex-text-muted">
              Enviados / total
            </p>
            <p className="font-display mt-2 text-2xl font-bold tabular-nums text-jurnex-text-primary sm:text-[1.65rem]">
              {emailsEnviados}
              <span className="text-jurnex-text-muted"> / </span>
              {totalInvitados}
            </p>
            <p className="mt-1 text-xs text-jurnex-text-muted">Correos de invitación registrados</p>
          </div>
          <div
            className={`rounded-jurnex-md border border-jurnex-primary/25 bg-jurnex-primary-soft shadow-inner backdrop-blur-sm ${compactSpacing ? "px-3 py-2" : "px-4 py-4"}`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-jurnex-primary/90">
              Abrieron tras el correo
            </p>
            <p className="font-display mt-2 text-2xl font-bold tabular-nums text-jurnex-primary sm:text-[1.65rem]">
              {abrieronTrasCorreo}
            </p>
            <p className="mt-1 text-xs text-jurnex-text-secondary">
              Con envío desde Jurnex que ya vieron la invitación (una fila = una persona)
            </p>
          </div>
          <div
            className={`rounded-jurnex-md border border-jurnex-secondary/30 bg-jurnex-secondary/[0.08] shadow-inner backdrop-blur-sm ${compactSpacing ? "px-3 py-2" : "px-4 py-4"}`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-jurnex-secondary/85">
              Tasa apertura (correo)
            </p>
            <p className="font-display mt-2 text-2xl font-bold tabular-nums text-jurnex-secondary sm:text-[1.65rem]">
              {emailsEnviados > 0 ? `${tasaPct} %` : "—"}
            </p>
            {emailsEnviados > 0 ? (
              <>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-jurnex-bg/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-jurnex-primary to-jurnex-secondary"
                    style={{ width: `${tasaPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-jurnex-text-secondary">
                  {abrieronTrasCorreo} de {emailsEnviados} con correo enviado
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-jurnex-text-muted">Envía correos para ver esta métrica</p>
            )}
          </div>
        </div>

        {vistasSinCorreoDesdePanel > 0 ? (
          <p
            className={`mt-4 rounded-jurnex-md border px-4 py-3 text-sm text-jurnex-text-secondary ${subdued ? "border-jurnex-border/40 bg-jurnex-surface/35" : "border-jurnex-border bg-jurnex-surface/60"}`}
          >
            <span className="font-medium text-jurnex-text-primary">{vistasSinCorreoDesdePanel}</span>{" "}
            {vistasSinCorreoDesdePanel === 1 ? "persona abrió" : "personas abrieron"} la invitación sin
            tener correo enviado desde Jurnex (por ejemplo enlace o WhatsApp). Por eso el número de
            arriba puede ser menor que quienes viste en la lista.
          </p>
        ) : null}

        <div
          className={`flex flex-col gap-2.5 sm:flex-row sm:flex-wrap ${compactSpacing ? "mt-4" : "mt-7"}`}
        >
          <Button
            type="button"
            disabled={pending}
            onClick={() => void run("unsent")}
            className="inline-flex rounded-full px-5 py-2.5"
          >
            {pending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
            Enviar a pendientes de correo
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => void run("pending_rsvp")}
            className="inline-flex rounded-full px-5 py-2.5"
          >
            {pending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
            Reenviar a pendientes de confirmación
          </Button>
        </div>
      </div>
    </div>
  );
}
