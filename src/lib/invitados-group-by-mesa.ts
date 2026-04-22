import type { Invitado } from "@/types/database";

export type MesaGrupo = {
  key: string;
  label: string;
  invitados: Invitado[];
};

/** Agrupa por texto de mesa (`asiento`); vacío → sin mesa. Ordena invitados por nombre. */
export function groupInvitadosByMesa(rows: Invitado[]): MesaGrupo[] {
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
    list.sort((a, b) =>
      (a.nombre_pasajero ?? "").localeCompare(b.nombre_pasajero ?? "", "es", { sensitivity: "base" })
    );
    return {
      key: mesaKey || "sin-mesa",
      label: mesaKey ? `Mesa ${mesaKey}` : "Sin mesa asignada",
      invitados: list,
    };
  });
}
