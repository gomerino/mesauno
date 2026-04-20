"use client";

import { BulkImportInvitados } from "@/components/BulkImportInvitados";
import { Button, Card, Chip, Input, Textarea } from "@/components/jurnex-ui";
import { InvitadosMesaAccordion } from "@/components/panel/invitados/InvitadosMesaAccordion";
import {
  INVITADOS_DESKTOP_GRID,
  InvitadoMesaDesktopBlock,
  InvitadoMesaMobileCard,
} from "@/components/panel/invitados/InvitadosMesaRows";
import type { Invitado } from "@/types/database";
import { sortInvitadoAcompanantes } from "@/lib/invitado-acompanantes";
import { restriccionesFromDb, restriccionesToDb } from "@/lib/restricciones-alimenticias";
import { supabaseErrorMessage } from "@/lib/supabase-error";
import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

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

const label = "block text-xs font-medium text-jurnex-text-secondary";

type Props = {
  eventoId: string | null;
  initialInvitados: Invitado[];
};

type RsvpBucket = "confirmado" | "pendiente" | "declinado";

const RSVP_SECTION_ORDER: RsvpBucket[] = ["confirmado", "pendiente", "declinado"];

function normalizeRsvp(estado: string | null | undefined): RsvpBucket {
  if (estado === "confirmado" || estado === "declinado" || estado === "pendiente") {
    return estado;
  }
  return "pendiente";
}

/** Agrupa por texto de asiento (mesa); vacío → sin mesa. Dentro, por RSVP. */
function groupInvitadosByMesaYRsvp(rows: Invitado[]) {
  const byMesa = new Map<string, Invitado[]>();
  for (const r of rows) {
    const k = r.asiento?.trim() ?? "";
    if (!byMesa.has(k)) byMesa.set(k, []);
    byMesa.get(k)!.push(r);
  }
  const keys = Array.from(byMesa.keys()).sort((a, b) => {
    if (a === "" && b !== "") return 1;
    if (b === "" && a !== "") return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
  return keys.map((mesaKey) => {
    const list = byMesa.get(mesaKey)!;
    const byRsvp: Record<RsvpBucket, Invitado[]> = {
      confirmado: [],
      pendiente: [],
      declinado: [],
    };
    for (const r of list) {
      byRsvp[normalizeRsvp(r.rsvp_estado)].push(r);
    }
    for (const bucket of RSVP_SECTION_ORDER) {
      byRsvp[bucket].sort((a, b) =>
        (a.nombre_pasajero ?? "").localeCompare(b.nombre_pasajero ?? "", "es", { sensitivity: "base" })
      );
    }
    return {
      key: mesaKey || "sin-mesa",
      label: mesaKey ? `Mesa ${mesaKey}` : "Sin mesa asignada",
      byRsvp,
    };
  });
}

function computeDefaultOpenMesaKey(
  mesas: { key: string; byRsvp: Record<RsvpBucket, Invitado[]> }[]
): string | null {
  if (mesas.length === 0) return null;
  return mesas[0].key;
}

function mesaInvitadoStats(mesa: { byRsvp: Record<RsvpBucket, Invitado[]> }) {
  const confirmados = mesa.byRsvp.confirmado.length;
  const pendientes = mesa.byRsvp.pendiente.length;
  const total =
    confirmados + pendientes + mesa.byRsvp.declinado.length;
  const progressPct = total > 0 ? Math.round((confirmados / total) * 100) : 0;
  return { total, confirmados, pendientes, progressPct };
}

function mesaDomIdSafe(mesaKey: string) {
  return mesaKey.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function InvitadosManager({ eventoId, initialInvitados }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isNavPending, startTransition] = useTransition();
  const [rows, setRows] = useState<Invitado[]>(initialInvitados);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [highlightNewId, setHighlightNewId] = useState<string | null>(null);

  useEffect(() => {
    if (modalOpen) return;
    setRows(initialInvitados);
  }, [initialInvitados, modalOpen]);

  useEffect(() => {
    if (expandedRowId && !rows.some((r) => r.id === expandedRowId)) {
      setExpandedRowId(null);
    }
  }, [rows, expandedRowId]);

  useEffect(() => {
    if (!highlightNewId) return;
    const t = window.setTimeout(() => setHighlightNewId(null), 2400);
    return () => window.clearTimeout(t);
  }, [highlightNewId]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [openMesaKey, setOpenMesaKey] = useState<string | null>(() =>
    computeDefaultOpenMesaKey(groupInvitadosByMesaYRsvp(initialInvitados))
  );
  const mesaHeaderRefs = useRef(new Map<string, HTMLButtonElement>());

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  }

  const openEdit = useCallback((row: Invitado) => {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setFormError(null);
    setModalOpen(true);
  }, []);

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
      setHighlightNewId(full.id);
    }
    const fromMission =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("from") === "mission";
    trackEvent("guest_created", {
      is_first_guest: isFirstGuest,
      from_mission: fromMission,
      has_email: Boolean(payload.email),
      has_phone: Boolean(payload.telefono),
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
    [supabase]
  );

  const handleSendEmail = useCallback(
    async (id: string) => {
      const row = rows.find((x) => x.id === id);
      if (!row?.email?.trim()) {
        toast.error("Añade un correo al invitado antes de enviar.", { duration: 4000 });
        return;
      }
      setSendingId(id);
      try {
        const res = await fetch("/api/invitaciones/enviar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitadoId: id }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          toast.error(json.error ?? "No se pudo enviar. Intenta nuevamente.", { duration: 4000 });
        } else {
          toast.success("Invitación enviada", { duration: 4000 });
        }
      } catch {
        toast.error("No se pudo enviar. Intenta nuevamente.", { duration: 4000 });
      } finally {
        setSendingId(null);
      }
    },
    [rows]
  );

  const toggleMesa = useCallback((key: string) => {
    setOpenMesaKey((cur) => {
      const next = cur === key ? null : key;
      if (next) {
        requestAnimationFrame(() => {
          mesaHeaderRefs.current.get(next)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
      return next;
    });
  }, []);

  const toggleRowExpand = useCallback((id: string) => {
    setExpandedRowId((cur) => (cur === id ? null : id));
  }, []);

  const rsvpLabel: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmó",
    declinado: "No asiste",
  };

  function rsvpTone(estado: string | null | undefined): "success" | "danger" | "muted" {
    const e = estado ?? "pendiente";
    if (e === "confirmado") return "success";
    if (e === "declinado") return "danger";
    return "muted";
  }

  const mesasAgrupadas = useMemo(() => groupInvitadosByMesaYRsvp(rows), [rows]);
  const defaultOpenMesaKey = useMemo(
    () => computeDefaultOpenMesaKey(mesasAgrupadas),
    [mesasAgrupadas]
  );

  useEffect(() => {
    setOpenMesaKey((prev) => {
      if (prev != null && mesasAgrupadas.some((m) => m.key === prev)) return prev;
      return defaultOpenMesaKey;
    });
  }, [rows, mesasAgrupadas, defaultOpenMesaKey]);

  useEffect(() => {
    if (!openMesaKey) {
      setExpandedRowId(null);
      return;
    }
    const mesa = mesasAgrupadas.find((m) => m.key === openMesaKey);
    if (!mesa || !expandedRowId) return;
    const inMesa = RSVP_SECTION_ORDER.some((e) =>
      mesa.byRsvp[e].some((r) => r.id === expandedRowId)
    );
    if (!inMesa) setExpandedRowId(null);
  }, [openMesaKey, mesasAgrupadas, expandedRowId]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-white md:text-xl">
              Personas invitadas
            </h2>
            <p className="mt-1 text-xs leading-snug text-white/60">
              Agrupado por mesa (asiento) y confirmación; acompañantes con el titular.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
            >
              Importar lista
            </button>
            <button
              id="invitados-btn-add"
              type="button"
              onClick={openCreate}
              className="inline-flex rounded-full bg-teal-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-teal-300"
            >
              Añadir invitado
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="font-display text-sm font-medium text-white/70">Lista vacía</p>
            <p className="mt-2 text-sm text-white/45">
              Usa «Añadir invitado» o «Importar lista» para comenzar.
            </p>
          </div>
        ) : (
          <>
          <div
            className={`space-y-3 px-4 pb-4 pt-4 md:hidden transition-opacity duration-200 ease-out ${isNavPending ? "opacity-75" : "opacity-100"}`}
            aria-busy={isNavPending}
          >
            {mesasAgrupadas.map((mesa) => {
              const isOpen = openMesaKey === mesa.key;
              const stats = mesaInvitadoStats(mesa);
              const idFrag = mesaDomIdSafe(mesa.key);
              return (
                <section key={mesa.key} aria-label={mesa.label}>
                  <InvitadosMesaAccordion
                    label={mesa.label}
                    isOpen={isOpen}
                    onToggle={() => toggleMesa(mesa.key)}
                    headerRef={(el) => {
                      if (el) mesaHeaderRefs.current.set(mesa.key, el);
                      else mesaHeaderRefs.current.delete(mesa.key);
                    }}
                    totalPasajeros={stats.total}
                    confirmados={stats.confirmados}
                    pendientes={stats.pendientes}
                    progressPct={stats.progressPct}
                    headerId={`invitados-mesa-h-${idFrag}`}
                    contentId={`invitados-mesa-c-${idFrag}`}
                  >
                    {isOpen ? (
                      <div className="space-y-5">
                        {RSVP_SECTION_ORDER.map((estado) => {
                          const list = mesa.byRsvp[estado];
                          if (list.length === 0) return null;
                          return (
                            <div key={`${mesa.key}-${estado}`} className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2 px-0.5">
                                <Chip tone={rsvpTone(estado)}>{rsvpLabel[estado]}</Chip>
                                <span className="text-[10px] text-jurnex-text-muted">
                                  {list.length}{" "}
                                  {list.length === 1 ? "invitación" : "invitaciones"}
                                </span>
                              </div>
                              {list.map((row) => (
                                <InvitadoMesaMobileCard
                                  key={row.id}
                                  row={row}
                                  sendingId={sendingId}
                                  deletingId={deletingId}
                                  onEdit={openEdit}
                                  onDelete={handleDelete}
                                  onSendEmail={handleSendEmail}
                                />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </InvitadosMesaAccordion>
                </section>
              );
            })}
          </div>

          <div
            className={`hidden md:block space-y-3 px-4 pb-4 pt-0 transition-opacity duration-200 ease-out ${isNavPending ? "opacity-75" : "opacity-100"}`}
            aria-busy={isNavPending}
          >
            <p id="invitados-tabla-desc" className="sr-only">
              Lista de invitados agrupada por mesa y estado de confirmación; expande cada mesa
              para ver la tabla.
            </p>
            {mesasAgrupadas.map((mesa) => {
              const isOpen = openMesaKey === mesa.key;
              const stats = mesaInvitadoStats(mesa);
              const idFrag = mesaDomIdSafe(mesa.key);
              return (
                <InvitadosMesaAccordion
                  key={mesa.key}
                  label={mesa.label}
                  isOpen={isOpen}
                  onToggle={() => toggleMesa(mesa.key)}
                  headerRef={(el) => {
                    if (el) mesaHeaderRefs.current.set(mesa.key, el);
                    else mesaHeaderRefs.current.delete(mesa.key);
                  }}
                  totalPasajeros={stats.total}
                  confirmados={stats.confirmados}
                  pendientes={stats.pendientes}
                  progressPct={stats.progressPct}
                  headerId={`invitados-mesa-d-h-${idFrag}`}
                  contentId={`invitados-mesa-d-c-${idFrag}`}
                >
                  {isOpen ? (
                    <div className="overflow-x-auto">
                      <div
                        className="w-full min-w-[880px] text-left text-sm text-white/90"
                        aria-describedby="invitados-tabla-desc"
                      >
                        <div role="rowgroup">
                          <div
                            role="row"
                            className={`${INVITADOS_DESKTOP_GRID} sticky top-0 z-10 border-b border-white/10 bg-white/[0.03] text-xs font-medium uppercase tracking-wider text-white/40 backdrop-blur-md`}
                          >
                            <div className="py-2 pl-4 pr-2 text-left" role="columnheader">
                              Nombre
                            </div>
                            <div className="px-2 py-2 text-left" role="columnheader">
                              Correo
                            </div>
                            <div className="px-2 py-2 text-left" role="columnheader">
                              Teléfono
                            </div>
                            <div className="px-2 py-2 text-left" role="columnheader">
                              Restricciones
                            </div>
                            <div
                              className="border-l border-white/10 py-2 pl-3 pr-4 text-right"
                              role="columnheader"
                            >
                              Acciones
                            </div>
                          </div>
                        </div>
                        <div role="rowgroup">
                          {RSVP_SECTION_ORDER.map((estado) => {
                            const list = mesa.byRsvp[estado];
                            if (list.length === 0) return null;
                            return (
                              <Fragment key={`${mesa.key}-${estado}`}>
                                <div
                                  role="row"
                                  className={`${INVITADOS_DESKTOP_GRID} border-b border-white/5 bg-black/15`}
                                >
                                  <div className="col-span-5 px-4 py-1 pl-7" role="cell">
                                    <Chip tone={rsvpTone(estado)} className="py-0.5">
                                      {rsvpLabel[estado]}
                                    </Chip>
                                    <span className="ml-2 text-[10px] text-jurnex-text-muted">
                                      {list.length}{" "}
                                      {list.length === 1 ? "invitación" : "invitaciones"}
                                    </span>
                                  </div>
                                </div>
                                {list.map((row) => (
                                  <InvitadoMesaDesktopBlock
                                    key={row.id}
                                    row={row}
                                    isExpanded={expandedRowId === row.id}
                                    isNewHighlight={highlightNewId === row.id}
                                    onToggleExpand={toggleRowExpand}
                                    sendingId={sendingId}
                                    deletingId={deletingId}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onSendEmail={handleSendEmail}
                                  />
                                ))}
                              </Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </InvitadosMesaAccordion>
              );
            })}
          </div>
        </>
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
                  Familia o personas que comparten esta misma invitación; puedes añadir varias líneas.
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
                  Si lo dejas vacío, usamos el asiento por defecto que definiste en los datos del evento.
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
                <Button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-full">
                  {saving ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  ) : null}
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
