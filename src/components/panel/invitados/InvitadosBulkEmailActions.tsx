"use client";

import { sendInvitationsFromPanelAction } from "@/app/panel/invitaciones-actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Props = {
  eventoId: string;
  disabled?: boolean;
  /** Oculta el subtítulo «Envío masivo» (p. ej. cuando el padre ya trae el título «Acciones»). */
  compact?: boolean;
};

export function InvitadosBulkEmailActions({ eventoId, disabled, compact }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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

  return (
    <div className="flex flex-col gap-2">
      {!compact ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Envío masivo
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => void run("unsent")}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-medium text-white/90 transition hover:bg-white/[0.09] disabled:pointer-events-none disabled:opacity-45"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden /> : null}
        Enviar a pendientes de correo
      </button>
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => void run("pending_rsvp")}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white/90 disabled:pointer-events-none disabled:opacity-45"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden /> : null}
        Reenviar pendientes
      </button>
    </div>
  );
}
