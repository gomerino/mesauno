"use client";

import { addMemberToEvent, removeMemberFromEvent, type EquipoRol } from "@/app/dashboard/actions/equipo";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type MiembroRow = {
  user_id: string;
  email: string;
  rol: string;
  created_at: string | null;
};

type Props = {
  eventoId: string;
  initialMiembros: MiembroRow[];
  isAdmin: boolean;
};

const ROLES: { value: EquipoRol; label: string }[] = [
  { value: "editor", label: "Editor (novios, planner)" },
  { value: "staff_centro", label: "Staff centro de eventos (recepción)" },
  { value: "admin", label: "Administrador" },
];

function rolLabel(rol: string) {
  if (rol === "admin") return "Administrador";
  if (rol === "editor") return "Editor";
  if (rol === "staff_centro") return "Staff centro";
  return rol;
}

export function EquipoPageClient({ eventoId, initialMiembros, isAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<EquipoRol>("editor");
  const [removing, setRemoving] = useState<string | null>(null);

  function onInvite(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await addMemberToEvent(eventoId, email, rol);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.mode === "invited"
          ? "Invitación enviada por correo (Resend)"
          : "Miembro añadido al equipo"
      );
      setEmail("");
      router.refresh();
    });
  }

  async function onRemove(userId: string) {
    if (!confirm("¿Eliminar a esta persona del equipo?")) return;
    setRemoving(userId);
    const res = await removeMemberFromEvent(eventoId, userId);
    setRemoving(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Miembro eliminado");
    router.refresh();
  }

  return (
    <div className="mt-10 space-y-10">
      {isAdmin && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-lg font-semibold text-white">Invitar colaborador</h2>
          <p className="mt-1 text-sm text-slate-400">
            Si ya tiene cuenta en la app, se añade al instante. Si no, recibirá un correo (Resend) con el enlace
            de alta.
          </p>
          <form onSubmit={onInvite} className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="min-w-[200px] flex-1 flex flex-col gap-1 text-xs text-slate-400">
              Email del colaborador
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600"
                placeholder="nombre@correo.com"
              />
            </label>
            <label className="min-w-[220px] flex flex-col gap-1 text-xs text-slate-400">
              Rol
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as EquipoRol)}
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 hover:bg-teal-400 disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Enviar invitación"}
            </button>
          </form>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold text-white">Miembros actuales</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/30 text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 hidden sm:table-cell">Desde</th>
                {isAdmin && <th className="px-4 py-3 w-28"> </th>}
              </tr>
            </thead>
            <tbody>
              {initialMiembros.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-slate-500">
                    No hay miembros listados.
                  </td>
                </tr>
              )}
              {initialMiembros.map((m) => (
                <tr key={m.user_id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-white">{m.email}</td>
                  <td className="px-4 py-3 text-slate-300">{rolLabel(m.rol)}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString("es-ES") : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={removing === m.user_id}
                        onClick={() => void onRemove(m.user_id)}
                        className="text-xs font-medium text-red-300 hover:text-red-200 disabled:opacity-50"
                      >
                        {removing === m.user_id ? "…" : "Eliminar"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
