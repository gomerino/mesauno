"use client";

import { trackEvent } from "@/lib/analytics";
import { parseBulkInvitados, type BulkParsedRow, type ExistingGuest } from "@/lib/invitados-bulk";
import { createClient } from "@/lib/supabase/client";
import { supabaseErrorMessage } from "@/lib/supabase-error";
import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  eventoId: string | null;
  existing: ExistingGuest[];
  onImported: () => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-teal-500 focus:ring-2";

/** Badge por estado de la línea. */
function StatusBadge({ row }: { row: BulkParsedRow }) {
  if (row.status === "new") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        Nuevo
      </span>
    );
  }
  if (row.status === "duplicate") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
        Se omite
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
      Inválido
    </span>
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

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      setSubmitting(false);
      setErrorMsg("Sesión inválida. Inicia sesión nuevamente para importar.");
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

    if (ok > 0) onImported();
    if (fail > 0 && firstErrorMsg) setErrorMsg(firstErrorMsg);
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
        className="flex max-h-[78vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl animate-fadeIn sm:max-h-[80vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-import-title"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6">
          <h2 id="bulk-import-title" className="font-display text-xl font-bold text-white">
            Importar lista de invitados
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Pega un invitado por línea. Puedes agregar email y teléfono separados por coma.
          </p>

          <div className="mt-4 space-y-2 pb-4">
            <label className="block text-xs font-medium text-slate-400" htmlFor="bulk-raw">
              Lista
            </label>
            <textarea
              id="bulk-raw"
              rows={6}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={"María González\nJuan Pérez, juan@mail.com\nAna Ruiz, ana@mail.com, +54 11 1234 5678"}
              className={`${inputClass} min-h-[120px] font-mono text-xs leading-relaxed`}
              disabled={submittedOk}
            />
            <p className="text-[11px] text-slate-500">
              Formato: <span className="font-mono">Nombre</span> · o{" "}
              <span className="font-mono">Nombre, email</span> · o{" "}
              <span className="font-mono">Nombre, email, teléfono</span>
            </p>
          </div>

          {summary.rows.length > 0 && !submittedOk ? (
            <div className="mt-2 space-y-2 pb-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="rounded-full bg-white/5 px-2 py-0.5">
                  Total: {summary.counts.total}
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                  Nuevos: {summary.counts.new}
                </span>
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                  Duplicados: {summary.counts.duplicate}
                </span>
                <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-red-300">
                  Inválidos: {summary.counts.invalid}
                </span>
              </div>

              <ul className="space-y-1 rounded-xl border border-white/10 bg-black/20 p-2">
                {summary.rows.map((row) => (
                  <li
                    key={row.lineNumber}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]"
                  >
                    <span className="mt-0.5 font-mono text-[10px] text-slate-500">
                      {String(row.lineNumber).padStart(2, "0")}
                    </span>
                    <StatusBadge row={row} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{row.nombre || row.raw}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {[row.email, row.telefono].filter(Boolean).join(" · ") || row.reason || " "}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {submittedOk ? (
            <div className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <p className="font-medium">
                Se importaron {insertedCount} invitado{insertedCount === 1 ? "" : "s"}.
              </p>
              {failedCount > 0 ? (
                <p className="mt-1 text-amber-100">
                  {failedCount} no pudieron guardarse. Revisa los mensajes o intenta nuevamente.
                </p>
              ) : null}
            </div>
          ) : null}

          {errorMsg && !submittedOk ? (
            <p className="mt-2 rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">
              {errorMsg}
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t border-white/10 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10"
            >
              {submittedOk ? "Cerrar" : "Cancelar"}
            </button>
            {!submittedOk ? (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 rounded-full bg-teal-500 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
              >
                {submitting
                  ? "Importando…"
                  : summary.counts.new === 0
                    ? "Importar"
                    : `Importar ${summary.counts.new} nuevo${summary.counts.new === 1 ? "" : "s"}`}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
