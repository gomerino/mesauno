"use client";

import type { Evento } from "@/types/database";
import { useCallback, useEffect, useState } from "react";

type Row = Evento & { miembros_emails: string[] };

const label = "block text-xs font-medium text-slate-400";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-amber-500/50 focus:ring-2";

function fechaInput(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  return s.length === 10 ? s : "";
}

export function AdminEventosClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  /** Crear evento: un email por gestor (ilimitados; primero = admin del evento). */
  const [gestorEmails, setGestorEmails] = useState<string[]>([""]);
  /** Editar: añadir más gestores sin quitar los actuales. */
  const [gestoresAAñadir, setGestoresAAñadir] = useState<string[]>([""]);
  const [invitarCuentasNuevas, setInvitarCuentasNuevas] = useState(true);
  const [legacyEmail, setLegacyEmail] = useState("");
  const [legacyUserId, setLegacyUserId] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [fechaBoda, setFechaBoda] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/eventos");
      const j = (await res.json()) as { eventos?: Row[]; error?: string };
      if (!res.ok) {
        setError(j.error ?? "Error al cargar");
        return;
      }
      setRows(j.eventos ?? []);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setGestorEmails([""]);
    setGestoresAAñadir([""]);
    setInvitarCuentasNuevas(true);
    setLegacyEmail("");
    setLegacyUserId("");
    setN1("");
    setN2("");
    setFechaBoda("");
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setGestoresAAñadir([""]);
    setN1(row.nombre_novio_1 ?? "");
    setN2(row.nombre_novio_2 ?? "");
    setFechaBoda(fechaInput(row.fecha_boda));
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        nombre_novio_1: n1.trim() || null,
        nombre_novio_2: n2.trim() || null,
        fecha_boda: fechaBoda.trim() || null,
      };
      if (editing) {
        body.eventoId = editing.id;
        const extra = gestoresAAñadir.map((s) => s.trim()).filter(Boolean);
        if (extra.length > 0) {
          body.add_gestores_emails = extra;
          body.invitar_cuentas_nuevas = invitarCuentasNuevas;
        }
      } else {
        const list = gestorEmails.map((s) => s.trim()).filter(Boolean);
        const uid = legacyUserId.trim();
        const lem = legacyEmail.trim();

        if (list.length >= 1) {
          body.gestores_emails = list;
          body.invitar_cuentas_nuevas = invitarCuentasNuevas;
        } else if (uid || lem) {
          if (uid) body.userId = uid;
          if (lem) body.email = lem;
          body.invitar_cuentas_nuevas = invitarCuentasNuevas;
        } else {
          setFormError(
            "Añade al menos un email de gestor, o usa «Un solo gestor (avanzado)» con email o UUID."
          );
          setSaving(false);
          return;
        }
      }
      const res = await fetch("/api/admin/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setFormError(j.error ?? "Error al guardar");
        setSaving(false);
        return;
      }
      await load();
      closeModal();
    } catch {
      setFormError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-400">
          Cada evento puede tener <strong className="text-slate-300">varias cuentas gestoras</strong> (tantas como
          añadas). La primera cuenta queda como <strong className="text-slate-300">admin</strong> del evento en{" "}
          <code className="text-slate-300">evento_miembros</code>, el resto como editor. Invitación por correo vía
          Supabase.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
        >
          Nuevo evento
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[860px] text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Gestores (emails)</th>
              <th className="px-4 py-3">Nombre 1</th>
              <th className="px-4 py-3">Nombre 2</th>
              <th className="px-4 py-3">Fecha boda</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No hay eventos registrados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="max-w-[320px] px-4 py-3 font-mono text-xs text-slate-300">
                    {row.miembros_emails.length > 0 ? row.miembros_emails.join(" · ") : "—"}
                  </td>
                  <td className="px-4 py-3">{row.nombre_novio_1 ?? "—"}</td>
                  <td className="px-4 py-3">{row.nombre_novio_2 ?? "—"}</td>
                  <td className="px-4 py-3">{row.fecha_boda ? String(row.fecha_boda).slice(0, 10) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium hover:bg-white/10"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-evento-title"
          >
            <h2 id="admin-evento-title" className="font-display text-xl font-bold text-white">
              {editing ? "Editar evento" : "Nuevo evento"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {!editing && (
                <>
                  <div>
                    <label className={label}>Cuentas gestoras (email)</label>
                    <p className="mb-2 text-xs text-slate-500">
                      La primera será admin del evento; puedes añadir todas las que necesites.
                    </p>
                    <div className="space-y-2">
                      {gestorEmails.map((line, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            className={input}
                            type="email"
                            value={line}
                            onChange={(e) => {
                              const next = [...gestorEmails];
                              next[i] = e.target.value;
                              setGestorEmails(next);
                            }}
                            placeholder={`gestor${i + 1}@email.com`}
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-white/15 px-3 text-xs text-slate-300 hover:bg-white/10"
                            onClick={() => setGestorEmails(gestorEmails.filter((_, j) => j !== i))}
                            disabled={gestorEmails.length <= 1}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-sm font-medium text-amber-300 hover:text-amber-200"
                      onClick={() => setGestorEmails([...gestorEmails, ""])}
                    >
                      + Añadir otra cuenta
                    </button>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-white/20 bg-black/40"
                      checked={invitarCuentasNuevas}
                      onChange={(e) => setInvitarCuentasNuevas(e.target.checked)}
                    />
                    <span>
                      Invitar por correo si aún no tienen cuenta (enlace de Supabase para elegir contraseña).
                      Desactívalo solo si todos los emails ya están en Authentication.
                    </span>
                  </label>
                  <details className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-400">
                    <summary className="cursor-pointer text-slate-300">Un solo gestor (avanzado)</summary>
                    <p className="mt-2 text-xs">
                      Deja vacía la lista de arriba y usa uno de estos para vincular una sola cuenta:
                    </p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className={label}>Email cuenta existente</label>
                        <input
                          className={input}
                          type="email"
                          value={legacyEmail}
                          onChange={(e) => setLegacyEmail(e.target.value)}
                          placeholder="solo@cuenta.com"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label className={label}>O UUID (Supabase → Users)</label>
                        <input
                          className={input}
                          type="text"
                          value={legacyUserId}
                          onChange={(e) => setLegacyUserId(e.target.value)}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  </details>
                </>
              )}
              {editing && (
                <>
                  <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400">
                    <p className="font-medium text-slate-300">Gestores actuales</p>
                    <p className="mt-1 font-mono text-slate-200">
                      {editing.miembros_emails.length > 0 ? editing.miembros_emails.join(" · ") : "—"}
                    </p>
                  </div>
                  <div>
                    <label className={label}>Añadir más gestores (email)</label>
                    <p className="mb-2 text-xs text-slate-500">
                      Se unen al evento como editor. No se eliminan cuentas desde aquí.
                    </p>
                    <div className="space-y-2">
                      {gestoresAAñadir.map((line, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            className={input}
                            type="email"
                            value={line}
                            onChange={(e) => {
                              const next = [...gestoresAAñadir];
                              next[i] = e.target.value;
                              setGestoresAAñadir(next);
                            }}
                            placeholder="nuevo@email.com"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-white/15 px-3 text-xs text-slate-300 hover:bg-white/10"
                            onClick={() => setGestoresAAñadir(gestoresAAñadir.filter((_, j) => j !== i))}
                            disabled={gestoresAAñadir.length <= 1}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-sm font-medium text-amber-300 hover:text-amber-200"
                      onClick={() => setGestoresAAñadir([...gestoresAAñadir, ""])}
                    >
                      + Añadir otra fila
                    </button>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-white/20 bg-black/40"
                      checked={invitarCuentasNuevas}
                      onChange={(e) => setInvitarCuentasNuevas(e.target.checked)}
                    />
                    <span>Invitar por correo a cuentas nuevas (gestores que añadas arriba).</span>
                  </label>
                </>
              )}
              <div>
                <label className={label}>Nombre 1</label>
                <input className={input} value={n1} onChange={(e) => setN1(e.target.value)} />
              </div>
              <div>
                <label className={label}>Nombre 2</label>
                <input className={input} value={n2} onChange={(e) => setN2(e.target.value)} />
              </div>
              <div>
                <label className={label}>Fecha de la boda</label>
                <input
                  className={input}
                  type="date"
                  value={fechaBoda}
                  onChange={(e) => setFechaBoda(e.target.value)}
                />
              </div>
              {formError && (
                <p className="rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-full bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
