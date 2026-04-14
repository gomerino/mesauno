"use client";

import { WhatsAppInviteButton } from "@/components/dashboard/WhatsAppInviteButton";
import type { Invitado } from "@/types/database";
import { nombresAcompanantes, sortInvitadoAcompanantes } from "@/lib/invitado-acompanantes";
import { restriccionesFromDb, restriccionesToDb } from "@/lib/restricciones-alimenticias";
import { supabaseErrorMessage } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type FormState = {
  nombre: string;
  acompanantes: string[];
  email: string;
  telefono: string;
  /** Asiento en la invitación; si está vacío se usa el del evento. */
  asiento: string;
  restricciones_alimenticias: string;
};

function emptyForm(): FormState {
  return {
    nombre: "",
    acompanantes: [],
    email: "",
    telefono: "",
    asiento: "",
    restricciones_alimenticias: "",
  };
}

function rowToForm(row: Invitado): FormState {
  const fromRows =
    row.invitado_acompanantes && row.invitado_acompanantes.length > 0
      ? sortInvitadoAcompanantes(row.invitado_acompanantes).map((a) => a.nombre)
      : [];
  const legacy =
    !fromRows.length && row.nombre_acompanante?.trim()
      ? [row.nombre_acompanante.trim()]
      : [];
  return {
    nombre: row.nombre_pasajero ?? "",
    acompanantes: fromRows.length ? fromRows : legacy,
    email: row.email ?? "",
    telefono: row.telefono ?? "",
    asiento: row.asiento ?? "",
    restricciones_alimenticias: restriccionesFromDb(row.restricciones_alimenticias),
  };
}

function payloadFromForm(
  form: FormState,
  eventoId: string | null,
  ownerUserId: string,
  editingId: string | null
) {
  const base = {
    nombre_pasajero: form.nombre.trim(),
    email: form.email.trim() || null,
    telefono: form.telefono.trim() || null,
    asiento: form.asiento.trim() || null,
    restricciones_alimenticias: restriccionesToDb(form.restricciones_alimenticias),
  };
  if (!editingId) {
    // Siempre fijar owner_user_id al usuario logueado (RLS lo exige; no enviar null).
    if (eventoId) {
      return { ...base, evento_id: eventoId, owner_user_id: ownerUserId };
    }
    return { ...base, evento_id: null, owner_user_id: ownerUserId };
  }
  return base;
}

const label = "block text-xs font-medium text-slate-400";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2";

type Props = {
  eventoId: string | null;
  initialInvitados: Invitado[];
};

export function InvitadosManager({ eventoId, initialInvitados }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Invitado[]>(initialInvitados);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (modalOpen) return;
    setRows(initialInvitados);
  }, [initialInvitados, modalOpen]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendFlash, setSendFlash] = useState<{ id: string; ok: boolean; msg: string } | null>(
    null
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(row: Invitado) {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  async function syncAcompanantes(invitadoId: string, lines: string[]) {
    const trimmed = lines.map((n) => n.trim()).filter(Boolean);
    const { error } = await supabase.rpc("sync_invitado_acompanantes_panel", {
      p_invitado_id: invitadoId,
      p_nombres: trimmed,
    });
    return error;
  }

  async function fetchInvitadoFull(id: string): Promise<Invitado | null> {
    const nested = await supabase
      .from("invitados")
      .select("*, invitado_acompanantes(*)")
      .eq("id", id)
      .maybeSingle();
    if (!nested.error && nested.data) {
      const row = nested.data as Invitado;
      if (Array.isArray(row.invitado_acompanantes)) {
        return row;
      }
    }
    const plain = await supabase.from("invitados").select("*").eq("id", id).maybeSingle();
    if (plain.error || !plain.data) return null;
    const { data: acRows, error: acErr } = await supabase
      .from("invitado_acompanantes")
      .select("*")
      .eq("invitado_id", id)
      .order("orden", { ascending: true });
    if (acErr) {
      return { ...plain.data, invitado_acompanantes: [] } as Invitado;
    }
    return { ...plain.data, invitado_acompanantes: acRows ?? [] } as Invitado;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setFormError(null);
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      setSaving(false);
      setFormError("Inicia sesión para guardar.");
      return;
    }
    const payload = payloadFromForm(form, eventoId, user.id, editingId);

    if (editingId) {
      const { error } = await supabase.from("invitados").update(payload).eq("id", editingId);
      if (error) {
        setSaving(false);
        setFormError(supabaseErrorMessage(error));
        return;
      }
      const syncErr = await syncAcompanantes(editingId, form.acompanantes);
      if (syncErr) {
        setSaving(false);
        setFormError(supabaseErrorMessage(syncErr));
        return;
      }
      const full = await fetchInvitadoFull(editingId);
      setSaving(false);
      if (full) {
        setRows((r) => r.map((x) => (x.id === editingId ? full : x)));
      }
      closeModal();
      router.refresh();
      return;
    }

    // RPC SECURITY DEFINER + row_security off: el INSERT no depende del WITH CHECK de RLS (evita 42501 en PostgREST).
    const insPayload = payload as {
      nombre_pasajero: string;
      email: string | null;
      telefono: string | null;
      asiento: string | null;
      restricciones_alimenticias: string[] | null;
      evento_id: string | null;
      owner_user_id: string;
    };
    const { data: newId, error: insErr } = await supabase.rpc("insert_invitado_panel", {
      p_evento_id: insPayload.evento_id,
      p_nombre_pasajero: insPayload.nombre_pasajero,
      p_email: insPayload.email,
      p_telefono: insPayload.telefono,
      p_asiento: insPayload.asiento,
      p_restricciones_alimenticias: insPayload.restricciones_alimenticias,
    });

    if (insErr || newId == null || typeof newId !== "string") {
      setSaving(false);
      setFormError(insErr ? supabaseErrorMessage(insErr) : "No se pudo crear el invitado");
      return;
    }

    const syncErr = await syncAcompanantes(newId, form.acompanantes);
    if (syncErr) {
      await supabase.from("invitados").delete().eq("id", newId);
      setSaving(false);
      setFormError(supabaseErrorMessage(syncErr));
      return;
    }

    const full = await fetchInvitadoFull(newId);
    setSaving(false);
    if (full) {
      setRows((r) => [full, ...r]);
    }
    closeModal();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este invitado?")) return;
    const { error } = await supabase.from("invitados").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
  }

  async function handleSendEmail(id: string) {
    const row = rows.find((x) => x.id === id);
    if (!row?.email?.trim()) {
      setSendFlash({ id, ok: false, msg: "Añade un correo al invitado antes de enviar." });
      return;
    }
    setSendingId(id);
    setSendFlash(null);
    try {
      const res = await fetch("/api/invitaciones/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitadoId: id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSendFlash({ id, ok: false, msg: json.error ?? "No se pudo enviar" });
      } else {
        setSendFlash({ id, ok: true, msg: "Listo: invitación enviada." });
      }
    } catch {
      setSendFlash({ id, ok: false, msg: "Error de red" });
    } finally {
      setSendingId(null);
    }
  }

  const rsvpLabel: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmó",
    declinado: "No asiste",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-400"
        >
          Añadir invitado
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[800px] text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Asiento</th>
              <th className="px-4 py-3">Respuesta</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Aún no hay nadie en la lista. Usa «Añadir invitado» arriba.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">
                    <span className="block">{row.nombre_pasajero}</span>
                    {nombresAcompanantes(row).map((n, i) => (
                      <span key={`${i}-${n}`} className="mt-0.5 block text-xs font-normal text-slate-400">
                        + {n}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3">{row.email ?? "—"}</td>
                  <td className="px-4 py-3">{row.telefono ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">
                    {row.asiento?.trim() ? row.asiento.trim() : "—"}
                  </td>
                  <td className="px-4 py-3">{rsvpLabel[row.rsvp_estado ?? "pendiente"] ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {sendFlash?.id === row.id && (
                        <span
                          className={
                            sendFlash.ok ? "text-xs text-teal-300" : "text-xs text-orange-300"
                          }
                        >
                          {sendFlash.msg}
                        </span>
                      )}
                      <WhatsAppInviteButton
                        nombreInvitado={row.nombre_pasajero ?? ""}
                        telefono={row.telefono ?? ""}
                        tokenAcceso={String(row.token_acceso ?? row.id)}
                      />
                      <button
                        type="button"
                        onClick={() => handleSendEmail(row.id)}
                        disabled={sendingId === row.id}
                        className="rounded-full border border-[#001d66]/80 bg-[#001d66]/30 px-3 py-1 text-xs font-medium text-teal-100 hover:bg-[#001d66]/50 disabled:opacity-50"
                      >
                        {sendingId === row.id ? "Enviando…" : "Enviar invitación"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium hover:bg-white/10"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20"
                      >
                        Eliminar
                      </button>
                    </div>
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
            aria-labelledby="invitado-form-title"
          >
            <h2 id="invitado-form-title" className="font-display text-xl font-bold text-white">
              {editingId ? "Editar persona" : "Añadir invitado"}
            </h2>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className={label}>Nombre (titular de la invitación)</label>
                <input
                  className={input}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={label}>Acompañantes en la misma invitación (opcional)</label>
                <p className="mb-2 text-xs text-slate-500">
                  Familia o personas que comparten esta misma invitación; puedes añadir varias líneas.
                </p>
                <div className="space-y-2">
                  {form.acompanantes.map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={input}
                        value={line}
                        onChange={(e) => {
                          const next = [...form.acompanantes];
                          next[i] = e.target.value;
                          setForm({ ...form, acompanantes: next });
                        }}
                        placeholder={`Acompañante ${i + 1}`}
                        autoComplete="name"
                      />
                      <button
                        type="button"
                        className="shrink-0 rounded-lg border border-white/15 px-3 text-xs text-slate-300 hover:bg-white/10"
                        onClick={() =>
                          setForm({
                            ...form,
                            acompanantes: form.acompanantes.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-teal-300 hover:text-teal-200"
                  onClick={() => setForm({ ...form, acompanantes: [...form.acompanantes, ""] })}
                >
                  + Añadir acompañante
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Correo (para enviar la invitación)</label>
                  <input
                    className={input}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={label}>Teléfono</label>
                  <input
                    className={input}
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={label}>Asiento en la invitación</label>
                <input
                  className={input}
                  value={form.asiento}
                  onChange={(e) => setForm({ ...form, asiento: e.target.value })}
                  placeholder="Ej: 12A (opcional)"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Si lo dejas vacío, usamos el asiento por defecto que definiste en los datos del evento.
                </p>
              </div>
              <div>
                <label className={label}>Restricciones alimenticias</label>
                <textarea
                  className={`${input} min-h-[72px]`}
                  value={form.restricciones_alimenticias}
                  onChange={(e) => setForm({ ...form, restricciones_alimenticias: e.target.value })}
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">
                  {formError}
                </p>
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
                  className="flex-1 rounded-full bg-teal-500 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
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
