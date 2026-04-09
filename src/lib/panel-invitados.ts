import type { SupabaseClient } from "@supabase/supabase-js";

function sortMerged(
  rows: Record<string, unknown>[],
  orderBy: string,
  ascending: boolean
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const va = a[orderBy];
    const vb = b[orderBy];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const c = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
    return ascending ? c : -c;
  });
}

export type InvitadosPanelQueryOptions = {
  /** Por defecto `created_at` descendente. Usa `false` si el `select` no incluye columnas ordenables. */
  orderBy?: string | false;
  ascending?: boolean;
};

/**
 * Invitados del panel: por evento y/o por owner.
 * Con evento_id se hacen dos consultas y se unen (más fiable que .or() con UUID en PostgREST).
 */
export async function fetchInvitadosPanelRows(
  supabase: SupabaseClient,
  userId: string,
  eventoId: string | null,
  columns: string,
  options?: InvitadosPanelQueryOptions
): Promise<{ data: unknown[] | null; error: Error | null }> {
  const explicitOrder = options?.orderBy;
  const orderCol = explicitOrder === false ? false : explicitOrder ?? "created_at";
  const ascending = options?.ascending ?? false;

  if (!eventoId) {
    let q = supabase.from("invitados").select(columns).eq("owner_user_id", userId);
    if (orderCol) {
      q = q.order(orderCol, { ascending });
    }
    const { data, error } = await q;
    return { data: data ?? null, error: error as Error | null };
  }

  const [byEvento, byOwner] = await Promise.all([
    supabase.from("invitados").select(columns).eq("evento_id", eventoId),
    supabase.from("invitados").select(columns).eq("owner_user_id", userId),
  ]);

  const err = byEvento.error ?? byOwner.error;
  if (err) {
    return { data: null, error: err as Error };
  }

  const map = new Map<string, Record<string, unknown>>();
  for (const row of [...(byEvento.data ?? []), ...(byOwner.data ?? [])]) {
    const r = row as unknown as Record<string, unknown>;
    const id = r.id as string;
    if (id) map.set(id, r);
  }
  const values = Array.from(map.values());
  const merged =
    orderCol === false ? values : sortMerged(values, orderCol, ascending);
  return { data: merged, error: null };
}

/** Une filas de invitado_acompanantes a cada invitado (cuando el embed PostgREST no está disponible). */
export async function mergeInvitadoAcompanantesIntoRows(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id as string).filter(Boolean);
  if (ids.length === 0) return rows;

  const { data: acRows, error } = await supabase
    .from("invitado_acompanantes")
    .select("*")
    .in("invitado_id", ids)
    .order("orden", { ascending: true });

  if (error) {
    return rows.map((r) => ({
      ...r,
      invitado_acompanantes: Array.isArray(r.invitado_acompanantes)
        ? (r.invitado_acompanantes as unknown[])
        : [],
    }));
  }

  const byInv = new Map<string, Record<string, unknown>[]>();
  for (const a of (acRows ?? []) as Record<string, unknown>[]) {
    const iid = a.invitado_id as string;
    if (!iid) continue;
    const list = byInv.get(iid) ?? [];
    list.push(a);
    byInv.set(iid, list);
  }

  return rows.map((r) => {
    const id = r.id as string;
    const fromQuery = byInv.get(id);
    if (fromQuery && fromQuery.length > 0) {
      return { ...r, invitado_acompanantes: fromQuery };
    }
    const embedded = r.invitado_acompanantes as unknown[] | undefined;
    if (embedded && embedded.length > 0) return r;
    return { ...r, invitado_acompanantes: embedded ?? [] };
  });
}

/** Lista del panel con acompañantes: embed; si falla, `*` + carga aparte de invitado_acompanantes. */
export async function fetchInvitadosPanelRowsWithAcompanantes(
  supabase: SupabaseClient,
  userId: string,
  eventoId: string | null,
  options?: InvitadosPanelQueryOptions
) {
  const withEmbed = await fetchInvitadosPanelRows(
    supabase,
    userId,
    eventoId,
    "*, invitado_acompanantes(*)",
    options
  );
  if (!withEmbed.error && withEmbed.data) {
    const merged = await mergeInvitadoAcompanantesIntoRows(
      supabase,
      withEmbed.data as Record<string, unknown>[]
    );
    return { data: merged, error: null };
  }

  const plain = await fetchInvitadosPanelRows(supabase, userId, eventoId, "*", options);
  if (plain.error || !plain.data?.length) return plain;
  const merged = await mergeInvitadoAcompanantesIntoRows(
    supabase,
    plain.data as Record<string, unknown>[]
  );
  return { data: merged, error: null };
}
