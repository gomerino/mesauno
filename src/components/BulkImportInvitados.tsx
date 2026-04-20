"use client";

import { Button, Chip, Textarea } from "@/components/jurnex-ui";
import { trackEvent } from "@/lib/analytics";
import { parseBulkInvitados, type BulkParsedRow, type ExistingGuest } from "@/lib/invitados-bulk";
import { createClient } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase-error";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  eventoId: string | null;
  existing: ExistingGuest[];
  onImported: () => void;
};

/** Badge por estado de la línea. */
function StatusBadge({ row }: { row: BulkParsedRow }) {
  if (row.status === "new") {
    return (
      <Chip tone="success" className="shrink-0 normal-case text-xs font-medium">
        Nuevo
      </Chip>
    );
  }
  if (row.status === "duplicate") {
    return (
      <Chip tone="warning" className="shrink-0 normal-case text-xs font-medium">
        Se omite
      </Chip>
    );
  }
  return (
    <Chip tone="danger" className="shrink-0 normal-case text-xs font-medium">
      Inválido
    </Chip>
  );
}

export function BulkImportInvitados({ open, onClose, eventoId, existing, onImported }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [insertedCount, setInsertedCount] = useState<number | null>(null);
  const [failedCount, setFailedCount] = useState<number>(0);

  const summary = useMemo(() => parseBulkInvitados(raw, existing), [raw, existing]);

  useEffect(() => {
    if (!open) return;
    trackEvent("bulk_import_opened");
    setRaw("");
    setErrorMsg(null);
    setInsertedCount(null);
    setFailedCount(0);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (summary.counts.new === 0 || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setInsertedCount(null);
    setFailedCount(0);

    const loadToast = toast.loading("Importando invitados…", { duration: 120_000 });

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      toast.dismiss(loadToast);
      setSubmitting(false);
      const msg = "Sesión inválida. Inicia sesión nuevamente para importar.";
      setErrorMsg(msg);
      toast.error(msg, { duration: 4000 });
      return;
    }

    const toInsert = summary.rows.filter((r) => r.status === "new");
    let ok = 0;
    let fail = 0;
    let firstErrorMsg: string | null = null;

    for (const row of toInsert) {
      const { error } = await supabase.rpc("insert_invitado_panel", {
        p_evento_id: eventoId,
        p_nombre_pasajero: row.nombre,
        p_email: row.email,
        p_telefono: row.telefono,
        p_asiento: null,
        p_restricciones_alimenticias: null,
      });
      if (error) {
        fail += 1;
        if (!firstErrorMsg) firstErrorMsg = supabaseErrorMessage(error);
      } else {
        ok += 1;
      }
    }

    toast.dismiss(loadToast);
    setSubmitting(false);
    setInsertedCount(ok);
    setFailedCount(fail);

    trackEvent("bulk_import_submitted", {
      count_total: summary.counts.total,
      count_new: summary.counts.new,
      count_dup: summary.counts.duplicate,
      count_invalid: summary.counts.invalid,
      count_ok: ok,
      count_fail: fail,
    });

    if (ok > 0) {
      toast.success(
        `Se agregaron ${ok} invitado${ok === 1 ? "" : "s"} correctamente`,
        { duration: 4000 }
      );
      onImported();
    }
    if (fail > 0) {
      toast.error(
        firstErrorMsg ?? "Algunos invitados no se pudieron guardar. Revisa e intenta nuevamente.",
        { duration: 4000 }
      );
      if (firstErrorMsg) setErrorMsg(firstErrorMsg);
    }
  }

  if (!open) return null;

  const submittedOk = insertedCount !== null;
  const canSubmit = summary.counts.new > 0 && !submitting && !submittedOk;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+56px+16px)] backdrop-blur-sm sm:items-center sm:p-4 sm:pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[78vh] w-full max-w-xl flex-col overflow-hidden rounded-jurnex-lg border border-jurnex-border bg-jurnex-bg/95 shadow-jurnex-card backdrop-blur-xl animate-fadeIn sm:max-h-[80vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-import-title"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6">
          <h2 id="bulk-import-title" className="font-display text-xl font-bold text-jurnex-text-primary">
            Importar lista de invitados
          </h2>
          <p className="mt-1 text-sm text-jurnex-text-secondary">
            Pega un invitado por línea. Puedes agregar email y teléfono separados por coma.
          </p>

          <div className="mt-4 space-y-2 pb-4">
            <label className="block text-xs font-medium text-jurnex-text-secondary" htmlFor="bulk-raw">
              Lista
            </label>
            <Textarea
              id="bulk-raw"
              rows={6}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={"María González\nJuan Pérez, juan@mail.com\nAna Ruiz, ana@mail.com, +54 11 1234 5678"}
              className="min-h-[120px] font-mono text-xs leading-relaxed"
              disabled={submittedOk}
            />
            <p className="text-[11px] text-jurnex-text-muted">
              Formato: <span className="font-mono">Nombre</span> · o{" "}
              <span className="font-mono">Nombre, email</span> · o{" "}
              <span className="font-mono">Nombre, email, teléfono</span>
            </p>
          </div>

          {summary.rows.length > 0 && !submittedOk ? (
            <div className="mt-2 space-y-2 pb-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <Chip tone="muted" className="normal-case">
                  Total: {summary.counts.total}
                </Chip>
                <Chip tone="success" className="normal-case">
                  Nuevos: {summary.counts.new}
                </Chip>
                <Chip tone="warning" className="normal-case">
                  Duplicados: {summary.counts.duplicate}
                </Chip>
                <Chip tone="danger" className="normal-case">
                  Inválidos: {summary.counts.invalid}
                </Chip>
              </div>

              <ul className="space-y-1 rounded-jurnex-md border border-jurnex-border bg-jurnex-surface/50 p-2">
                {summary.rows.map((row) => (
                  <li
                    key={row.lineNumber}
                    className="flex items-start gap-2 rounded-jurnex-sm px-2 py-1.5 hover:bg-jurnex-surface-hover"
                  >
                    <span className="mt-0.5 font-mono text-[10px] text-jurnex-text-muted">
                      {String(row.lineNumber).padStart(2, "0")}
                    </span>
                    <StatusBadge row={row} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-jurnex-text-primary">{row.nombre || row.raw}</p>
                      <p className="truncate text-[11px] text-jurnex-text-muted">
                        {[row.email, row.telefono].filter(Boolean).join(" · ") || row.reason || " "}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {submittedOk ? (
            <div className="mt-2 rounded-jurnex-md border border-jurnex-success/30 bg-jurnex-success/10 px-4 py-3 text-sm text-jurnex-success">
              <p className="font-medium">
                Se importaron {insertedCount} invitado{insertedCount === 1 ? "" : "s"}.
              </p>
              {failedCount > 0 ? (
                <p className="mt-1 text-jurnex-warning">
                  {failedCount} no pudieron guardarse. Revisa los mensajes o intenta nuevamente.
                </p>
              ) : null}
            </div>
          ) : null}

          {errorMsg && !submittedOk ? (
            <p className="mt-2 rounded-jurnex-sm border border-jurnex-warning/30 bg-jurnex-warning/10 px-3 py-2 text-sm text-jurnex-warning">
              {errorMsg}
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t border-jurnex-border bg-jurnex-bg/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" className="flex-1 rounded-full" onClick={onClose}>
              {submittedOk ? "Cerrar" : "Cancelar"}
            </Button>
            {!submittedOk ? (
              <Button type="submit" disabled={!canSubmit} className="flex flex-1 items-center justify-center gap-2 rounded-full">
                {submitting ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : null}
                {submitting
                  ? "Importando…"
                  : summary.counts.new === 0
                    ? "Importar"
                    : `Importar ${summary.counts.new} nuevo${summary.counts.new === 1 ? "" : "s"}`}
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
