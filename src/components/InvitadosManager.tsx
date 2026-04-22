"use client";

import { BulkImportInvitados } from "@/components/BulkImportInvitados";
import { Button, Input, Textarea } from "@/components/jurnex-ui";
import { InvitadosGrupo } from "@/components/panel/pasajeros/InvitadosGrupo";
import { useEnvioInvitaciones } from "@/hooks/useEnvioInvitaciones";
import { groupInvitadosByMesa } from "@/lib/invitados-group-by-mesa";
import { sortInvitadoAcompanantes } from "@/lib/invitado-acompanantes";
import { restriccionesFromDb, restriccionesToDb } from "@/lib/restricciones-alimenticias";
import { supabaseErrorMessage } from "@/lib/supabase-error";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import type { CanalEnvioInvitacion, Invitado } from "@/types/database";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type FormState = {
  nombre: string;
  acompanantes: string[];
  email: string;
  telefono: string;
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
    if (eventoId) {
      return { ...base, evento_id: eventoId, owner_user_id: ownerUserId };
    }
    return { ...base, evento_id: null, owner_user_id: ownerUserId };
  }
  return base;
}

const label = "block text-xs font-medium text-jurnex-text-secondary";

export type InvitadosManagerProps = {
  eventoId: string | null;
  initialInvitados: Invitado[];
  rows: Invitado[];
  setRows: Dispatch<SetStateAction<Invitado[]>>;
  canalPreferido: CanalEnvioInvitacion;
  envio: ReturnType<typeof useEnvioInvitaciones>;
  addInvitadoRef?: MutableRefObject<(() => void) | null>;
  importListRef?: MutableRefObject<(() => void) | null>;
};

function computeDefaultOpenMesaKey(mesas: { key: string }[]): string | null {
  if (mesas.length === 0) return null;
  return mesas[0].key;
}

export function InvitadosManager({
  eventoId,
  initialInvitados,
  rows,
  setRows,
  canalPreferido,
  envio,
  addInvitadoRef,
  importListRef,
}: InvitadosManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isNavPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (modalOpen) return;
    setRows(initialInvitados);
  }, [initialInvitados, modalOpen, setRows]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: Invitado) => {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setFormError(null);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (addInvitadoRef) addInvitadoRef.current = openCreate;
    return () => {
      if (addInvitadoRef) addInvitadoRef.current = null;
    };
  }, [addInvitadoRef, openCreate]);

  useEffect(() => {
    const openImport = () => setBulkOpen(true);
    if (importListRef) importListRef.current = openImport;
    return () => {
      if (importListRef) importListRef.current = null;
    };
  }, [importListRef]);

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  function refreshList() {
    startTransition(() => {
      router.refresh();
    });
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
    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedName = form.nombre.trim().toLowerCase();
    const duplicate = rows.find((r) => {
      if (editingId && r.id === editingId) return false;
      const sameEmail =
        normalizedEmail.length > 0 && (r.email ?? "").trim().toLowerCase() === normalizedEmail;
      const sameName = (r.nombre_pasajero ?? "").trim().toLowerCase() === normalizedName;
      return sameEmail || sameName;
    });
    if (duplicate) {
      setFormError("Este invitado ya existe. Revisa nombre o correo.");
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
      toast.error("Inicia sesión para guardar.", { duration: 4000 });
      return;
    }
    const payload = payloadFromForm(form, eventoId, user.id, editingId);

    if (editingId) {
      const { error } = await supabase.from("invitados").update(payload).eq("id", editingId);
      if (error) {
        setSaving(false);
        const msg = supabaseErrorMessage(error);
        setFormError(msg);
        toast.error(msg, { duration: 4000 });
        return;
      }
      const syncErr = await syncAcompanantes(editingId, form.acompanantes);
      if (syncErr) {
        setSaving(false);
        const msg = supabaseErrorMessage(syncErr);
        setFormError(msg);
        toast.error(msg, { duration: 4000 });
        return;
      }
      const full = await fetchInvitadoFull(editingId);
      setSaving(false);
      if (full) {
        setRows((r) => r.map((x) => (x.id === editingId ? full : x)));
      }
      closeModal();
      toast.success("Invitado actualizado", { duration: 4000 });
      refreshList();
      return;
    }

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
      const msg = insErr ? supabaseErrorMessage(insErr) : "No se pudo crear el invitado";
      setFormError(msg);
      toast.error(msg, { duration: 4000 });
      return;
    }

    const syncErr = await syncAcompanantes(newId, form.acompanantes);
    if (syncErr) {
      await supabase.from("invitados").delete().eq("id", newId);
      setSaving(false);
      const msg = supabaseErrorMessage(syncErr);
      setFormError(msg);
      toast.error(msg, { duration: 4000 });
      return;
    }

    const full = await fetchInvitadoFull(newId);
    const isFirstGuest = rows.length === 0;
    setSaving(false);
    if (full) {
      setRows((r) => [full, ...r]);
    }
    const fromMission =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("from") === "mission";
    trackEvent("guest_created", {
      is_first_guest: isFirstGuest,
      from_mission: fromMission,
      has_email: Boolean(insPayload.email),
      has_phone: Boolean(insPayload.telefono),
      companions_count: form.acompanantes.filter((n) => n.trim().length > 0).length,
    });
    closeModal();
    toast.success("Persona añadida a la lista", { duration: 4000 });
    refreshList();
  }

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("¿Eliminar este invitado?")) return;
      setDeletingId(id);
      try {
        const { error } = await supabase.from("invitados").delete().eq("id", id);
        if (error) {
          toast.error("No se pudo eliminar. Intenta nuevamente.", { duration: 4000 });
          return;
        }
        setRows((r) => r.filter((x) => x.id !== id));
        toast.success("Invitado eliminado de la lista", { duration: 4000 });
      } finally {
        setDeletingId(null);
      }
    },
    [supabase, setRows]
  );

  const mesasAgrupadas = useMemo(() => groupInvitadosByMesa(rows), [rows]);
  const defaultOpenMesaKey = useMemo(
    () => computeDefaultOpenMesaKey(mesasAgrupadas),
    [mesasAgrupadas]
  );

  const [openMesaKey, setOpenMesaKey] = useState<string | null>(() =>
    computeDefaultOpenMesaKey(groupInvitadosByMesa(initialInvitados))
  );

  useEffect(() => {
    setOpenMesaKey((prev) => {
      if (prev != null && mesasAgrupadas.some((m) => m.key === prev)) return prev;
      return defaultOpenMesaKey;
    });
  }, [mesasAgrupadas, defaultOpenMesaKey]);

  const toggleMesa = useCallback((key: string) => {
    setOpenMesaKey((cur) => (cur === key ? null : key));
  }, []);

  const onEnviarRow = useCallback(
    (id: string) => void envio.enviarIds(`row:${id}`, [id]),
    [envio]
  );
  const onReenviarRow = useCallback(
    (id: string) => void envio.reenviarIds(`row:${id}`, [id]),
    [envio]
  );
  const onEnviarGrupo = useCallback(
    (mesaKey: string, ids: string[]) => void envio.enviarIds(`mesa:${mesaKey}`, ids),
    [envio]
  );
  const onReenviarGrupo = useCallback(
    (mesaKey: string, ids: string[]) => void envio.reenviarIds(`mesa:${mesaKey}`, ids),
    [envio]
  );

  return (
    <div className="space-y-4">
      <div
        className={`transition-opacity duration-200 ease-out ${isNavPending ? "opacity-75" : "opacity-100"}`}
        aria-busy={isNavPending}
      >
        {rows.length === 0 ? (
          <div className="px-2 py-10 text-center sm:px-4">
            <p className="font-display text-sm font-medium text-white/70">Lista vacía</p>
            <p className="mt-2 text-sm text-white/45">
              Usá «Añadir invitado» o «Importar lista» arriba para comenzar.
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-1 pb-2 pt-0.5 sm:space-y-5 sm:px-2 sm:pt-1">
            {mesasAgrupadas.map((mesa) => (
              <InvitadosGrupo
                key={mesa.key}
                mesaKey={mesa.key}
                label={mesa.label}
                invitados={mesa.invitados}
                isOpen={openMesaKey === mesa.key}
                onToggle={() => toggleMesa(mesa.key)}
                canalPreferido={canalPreferido}
                busyScope={envio.busyScope}
                onEnviarGrupo={onEnviarGrupo}
                onReenviarGrupo={onReenviarGrupo}
                onEnviarRow={onEnviarRow}
                onReenviarRow={onReenviarRow}
                onEdit={openEdit}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 pb-[calc(env(safe-area-inset-bottom)+56px+16px)] backdrop-blur-sm sm:items-center sm:p-4 sm:pb-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <form
            onSubmit={handleSave}
            className="flex max-h-[78vh] w-full max-w-lg flex-col overflow-hidden rounded-jurnex-lg border border-jurnex-border bg-jurnex-bg/95 shadow-jurnex-card backdrop-blur-xl animate-fadeIn sm:max-h-[80vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invitado-form-title"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6">
              <h2 id="invitado-form-title" className="font-display text-xl font-bold text-jurnex-text-primary">
                {editingId ? "Editar persona" : "Añadir invitado"}
              </h2>
              <div className="mt-6 space-y-4 pb-4">
                <div>
                  <label className={label}>Nombre (titular de la invitación)</label>
                  <Input
                    className="mt-1"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={label}>Acompañantes en la misma invitación (opcional)</label>
                  <p className="mb-2 text-xs text-jurnex-text-muted">
                    Familia o personas que comparten esta misma invitación; podés añadir varias líneas.
                  </p>
                  <div className="space-y-2">
                    {form.acompanantes.map((line, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          className="mt-0 flex-1"
                          value={line}
                          onChange={(e) => {
                            const next = [...form.acompanantes];
                            next[i] = e.target.value;
                            setForm({ ...form, acompanantes: next });
                          }}
                          placeholder={`Acompañante ${i + 1}`}
                          autoComplete="name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="shrink-0 rounded-jurnex-sm px-3 py-2 text-xs"
                          onClick={() =>
                            setForm({
                              ...form,
                              acompanantes: form.acompanantes.filter((_, j) => j !== i),
                            })
                          }
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-2 px-0 text-sm text-jurnex-primary hover:bg-transparent"
                    onClick={() => setForm({ ...form, acompanantes: [...form.acompanantes, ""] })}
                  >
                    + Añadir acompañante
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label}>Correo (para enviar la invitación)</label>
                    <Input
                      className="mt-1"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label}>Teléfono</label>
                    <Input
                      className="mt-1"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Asiento en la invitación</label>
                  <Input
                    className="mt-1"
                    value={form.asiento}
                    onChange={(e) => setForm({ ...form, asiento: e.target.value })}
                    placeholder="Ej: 12A (opcional)"
                    autoComplete="off"
                  />
                  <p className="mt-1 text-xs text-jurnex-text-muted">
                    Si lo dejás vacío, usamos el asiento por defecto que definiste en los datos del evento.
                  </p>
                </div>
                <div>
                  <label className={label}>Restricciones alimenticias</label>
                  <Textarea
                    className="mt-1"
                    value={form.restricciones_alimenticias}
                    onChange={(e) => setForm({ ...form, restricciones_alimenticias: e.target.value })}
                  />
                </div>

                {formError && (
                  <p className="rounded-jurnex-sm border border-jurnex-warning/30 bg-jurnex-warning/10 px-3 py-2 text-sm text-jurnex-warning">
                    {formError}
                  </p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-jurnex-border bg-jurnex-bg/95 px-6 py-4 backdrop-blur-md">
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1 rounded-full" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full"
                >
                  {saving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
                  {saving ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <BulkImportInvitados
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        eventoId={eventoId}
        existing={rows.map((r) => ({
          nombre_pasajero: r.nombre_pasajero,
          email: r.email,
        }))}
        onImported={() => {
          refreshList();
        }}
      />
    </div>
  );
}
