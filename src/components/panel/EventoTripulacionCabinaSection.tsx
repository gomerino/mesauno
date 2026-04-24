"use client";

import { addMemberToEvent, removeMemberFromEvent, type EquipoRol } from "@/app/panel/actions/equipo";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import Link from "next/link";

export type MiembroEquipoRow = {
  user_id: string;
  email: string;
  rol: string;
  created_at: string | null;
};

type Props = {
  eventoId: string;
  initialMiembros: MiembroEquipoRow[];
  isAdmin: boolean;
};

/** Perfiles que mostramos en el panel: solo novios (editor) y recepción (staff_centro). */
const PERFILES_INVITE: { value: Exclude<EquipoRol, "admin">; label: string; hint: string }[] = [
  {
    value: "editor",
    label: "Novios (organización)",
    hint: "Misma lógica que en Ajustes: puede editar invitación, lista, fechas, etc.",
  },
  {
    value: "staff_centro",
    label: "Recepción",
    hint: "Staff del lugar: check-in y vista operativa, sin el mismo acceso a editar que novios.",
  },
];

function perfilLabel(rol: string) {
  if (rol === "admin") return "Administrador";
  if (rol === "editor") return "Novios";
  if (rol === "staff_centro") return "Recepción";
  return rol;
}

export function EventoTripulacionCabinaSection({ eventoId, initialMiembros, isAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Exclude<EquipoRol, "admin">>("editor");
  const [removing, setRemoving] = useState<string | null>(null);

  function onInvite(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await addMemberToEvent(eventoId, email, rol);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.mode === "invited" ? "Le enviamos un correo para unirse" : "Ya puede acceder con su cuenta"
      );
      setEmail("");
      router.refresh();
    });
  }

  async function onRemove(userId: string) {
    if (!confirm("¿Quitar a esta persona del acceso al evento?")) return;
    setRemoving(userId);
    const res = await removeMemberFromEvent(eventoId, userId);
    setRemoving(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Listo, ya no tiene acceso");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-white/55">
        Mismos datos y permisos que en{" "}
        <Link href="/panel/ajustes" className="text-teal-300/90 underline decoration-teal-500/40 hover:text-teal-200">
          Ajustes
        </Link>{" "}
        (Quién organiza contigo). Desde aquí podés invitar solo con perfiles{" "}
        <span className="text-white/75">novios</span> o <span className="text-white/75">recepción</span>. Para otro
        administrador, usá Ajustes.
      </p>

      {isAdmin && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Invitar organizador</p>
          <p className="mt-1 text-xs text-white/50">Correo obligatorio. El usuario ya debe existir o le llega invitación.</p>
          <form onSubmit={onInvite} className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="min-w-[10rem] flex-1 text-xs text-white/60">
              <span className="block">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600"
                placeholder="correo@ejemplo.com"
              />
            </label>
            <label className="min-w-[12rem] sm:max-w-[20rem] text-xs text-white/60">
              <span className="block">Perfil</span>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as Exclude<EquipoRol, "admin">)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {PERFILES_INVITE.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-teal-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-teal-400 disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Invitar"}
            </button>
          </form>
          <p className="mt-2 text-[10px] leading-relaxed text-white/40">
            {PERFILES_INVITE.find((p) => p.value === rol)?.hint}
          </p>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Quién tiene acceso</p>
        <div className="mt-2 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[min(100%,20rem)] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-[10px] uppercase tracking-wide text-white/45">
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Perfil</th>
                <th className="px-3 py-2.5 hidden sm:table-cell">Desde</th>
                {isAdmin && <th className="w-20 px-3 py-2.5"> </th>}
              </tr>
            </thead>
            <tbody>
              {initialMiembros.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-3 py-6 text-center text-xs text-white/45">
                    Aún no hay otras cuentas conectadas. Invitá novios o recepción con el formulario de arriba.
                  </td>
                </tr>
              )}
              {initialMiembros.map((m) => (
                <tr key={m.user_id} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                  <td className="px-3 py-2.5 text-white/90 break-all">{m.email}</td>
                  <td className="px-3 py-2.5 text-white/70">{perfilLabel(m.rol)}</td>
                  <td className="hidden px-3 py-2.5 text-white/50 sm:table-cell">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString("es-CL") : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2.5 text-right">
                      {m.rol === "admin" ? (
                        <span className="text-[10px] text-white/40">—</span>
                      ) : (
                        <button
                          type="button"
                          disabled={removing === m.user_id}
                          onClick={() => void onRemove(m.user_id)}
                          className="text-xs font-medium text-rose-300/90 hover:text-rose-200 disabled:opacity-50"
                        >
                          {removing === m.user_id ? "…" : "Quitar"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isAdmin && (
          <p className="mt-2 text-[10px] text-white/40">Solo la cuenta administradora puede invitar o quitar personas.</p>
        )}
      </div>
    </div>
  );
}
