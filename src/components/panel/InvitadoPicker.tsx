"use client";

import { useRouter } from "next/navigation";

type Item = { id: string; nombre: string };

type Props = {
  invitados: Item[];
  currentId: string;
};

export function InvitadoPicker({ invitados, currentId }: Props) {
  const router = useRouter();

  return (
    <label className="block max-w-xl">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Ver invitación de
      </span>
      <select
        className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-teal-500 focus:ring-2"
        value={currentId}
        onChange={(e) =>
          router.push(`/panel/vista-invitacion?id=${encodeURIComponent(e.target.value)}`)
        }
      >
        {invitados.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
