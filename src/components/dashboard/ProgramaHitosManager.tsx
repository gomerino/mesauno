"use client";

import {
  createProgramaHito,
  deleteProgramaHito,
  reorderProgramaHitos,
  updateProgramaHito,
} from "@/app/dashboard/actions/programa";
import {
  PROGRAMA_ICONOS,
  ProgramaIconoLucide,
  programaIconoLabel,
  type ProgramaIconoId,
} from "@/lib/programa-icons";
import type { EventoProgramaHito } from "@/types/database";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  eventoId: string;
  initialHitos: EventoProgramaHito[];
};

function horaInputValue(hora: string): string {
  return hora?.slice(0, 5) ?? "12:00";
}

type FormState = {
  hora: string;
  titulo: string;
  descripcion_corta: string;
  lugar_nombre: string;
  ubicacion_url: string;
  icono: ProgramaIconoId;
};

const emptyForm: FormState = {
  hora: "12:00",
  titulo: "",
  descripcion_corta: "",
  lugar_nombre: "",
  ubicacion_url: "",
  icono: "Music",
};

function sortHitos(list: EventoProgramaHito[]) {
  return [...list].sort((a, b) => a.orden - b.orden || a.hora.localeCompare(b.hora));
}

export function ProgramaHitosManager({ eventoId, initialHitos }: Props) {
  const router = useRouter();
  const [hitos, setHitos] = useState(() => sortHitos(initialHitos));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setHitos(sortHitos(initialHitos));
  }, [initialHitos]);

  function startEdit(h: EventoProgramaHito) {
    setEditingId(h.id);
    setForm({
      hora: horaInputValue(h.hora),
      titulo: h.titulo,
      descripcion_corta: h.descripcion_corta ?? "",
      lugar_nombre: h.lugar_nombre ?? "",
      ubicacion_url: h.ubicacion_url ?? "",
      icono: (PROGRAMA_ICONOS as readonly string[]).includes(h.icono)
        ? (h.icono as (typeof PROGRAMA_ICONOS)[number])
        : "Music",
    });
    setMsg(null);
    setErr(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await createProgramaHito(eventoId, { ...form, icono: form.icono });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setMsg("Hito añadido.");
      setForm(emptyForm);
      router.refresh();
    });
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await updateProgramaHito(eventoId, editingId, { ...form, icono: form.icono });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setMsg("Cambios guardados.");
      cancelEdit();
      router.refresh();
    });
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este hito del programa?")) return;
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await deleteProgramaHito(eventoId, id);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setMsg("Eliminado.");
      if (editingId === id) cancelEdit();
      router.refresh();
    });
  }

  async function move(id: string, dir: "up" | "down") {
    const idx = hitos.findIndex((h) => h.id === id);
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || j < 0 || j >= hitos.length) return;
    const reordered = [...hitos];
    [reordered[idx], reordered[j]] = [reordered[j]!, reordered[idx]!];
    const nextIds = reordered.map((h) => h.id);
    setHitos(reordered);
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await reorderProgramaHitos(eventoId, nextIds);
      if (!r.ok) {
        setErr(r.error);
        setHitos(sortHitos(initialHitos));
        return;
      }
      setMsg("Orden actualizado.");
      router.refresh();
    });
  }

  const formTitle = editingId ? "Editar hito" : "Añadir hito";

  return (
    <div className="space-y-8">
      <form
        onSubmit={editingId ? onUpdate : onCreate}
        className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
      >
        <h2 className="font-display text-lg font-semibold text-white">{formTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-400">Hora</label>
            <input
              type="time"
              required
              value={form.hora}
              onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Título</label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Recepción, Ceremonia…"
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400">Descripción corta</label>
            <textarea
              value={form.descripcion_corta}
              onChange={(e) => setForm((f) => ({ ...f, descripcion_corta: e.target.value }))}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              placeholder="Detalle opcional para el invitado"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Nombre del lugar</label>
            <input
              type="text"
              value={form.lugar_nombre}
              onChange={(e) => setForm((f) => ({ ...f, lugar_nombre: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Link Google Maps</label>
            <input
              type="url"
              value={form.ubicacion_url}
              onChange={(e) => setForm((f) => ({ ...f, ubicacion_url: e.target.value }))}
              placeholder="https://maps.google.com/..."
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <div className="sm:col-span-2">
            <span className="block text-xs font-medium text-slate-400">Icono</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROGRAMA_ICONOS.map((id) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                    form.icono === id
                      ? "border-teal-400 bg-teal-500/20 text-white"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="icono"
                    value={id}
                    checked={form.icono === id}
                    onChange={() => setForm((f) => ({ ...f, icono: id }))}
                    className="sr-only"
                  />
                  <ProgramaIconoLucide nombre={id} className="h-4 w-4 shrink-0" />
                  {programaIconoLabel(id)}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
          >
            {pending ? "Guardando…" : editingId ? "Guardar cambios" : "Añadir al programa"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
      </form>

      <div>
        <h2 className="font-display text-lg font-semibold text-white">Itinerario ({hitos.length})</h2>
        <p className="mt-1 text-sm text-slate-500">Usa las flechas para cambiar el orden de aparición en la invitación.</p>
        <ul className="mt-4 space-y-3">
          {hitos.length === 0 ? (
            <li className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-slate-500">
              Aún no hay hitos. Añade el primero arriba.
            </li>
          ) : (
            hitos.map((h, i) => (
              <li
                key={h.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                    <ProgramaIconoLucide nombre={h.icono} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-teal-300">{horaInputValue(h.hora)}</p>
                    <p className="font-medium text-white">{h.titulo}</p>
                    {h.descripcion_corta ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{h.descripcion_corta}</p>
                    ) : null}
                    {h.lugar_nombre ? <p className="mt-1 text-xs text-slate-500">{h.lugar_nombre}</p> : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end">
                  <button
                    type="button"
                    aria-label="Subir"
                    disabled={pending || i === 0}
                    onClick={() => move(h.id, "up")}
                    className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Bajar"
                    disabled={pending || i === hitos.length - 1}
                    onClick={() => move(h.id, "down")}
                    className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(h)}
                    className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(h.id)}
                    className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {err ? <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{err}</p> : null}
      {msg ? <p className="text-sm text-teal-300">{msg}</p> : null}
    </div>
  );
}
