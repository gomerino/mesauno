import { EquipoPageClient } from "@/components/dashboard/EquipoPageClient";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type MiembroRow = {
  user_id: string;
  email: string;
  rol: string;
  created_at: string | null;
};

function parseList(data: unknown): MiembroRow[] {
  if (Array.isArray(data)) return data as MiembroRow[];
  if (typeof data === "string") {
    try {
      const p = JSON.parse(data) as unknown;
      return Array.isArray(p) ? (p as MiembroRow[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default async function EquipoPage({ params }: { params: Promise<{ evento_id: string }> }) {
  const { evento_id } = await params;
  const supabase = await createClient();

  const { data: rawList, error: listErr } = await supabase.rpc("evento_equipo_list", {
    p_evento_id: evento_id,
  });

  const { data: isAdmin } = await supabase.rpc("user_is_evento_admin", {
    p_evento_id: evento_id,
  });

  const { data: evento } = await supabase
    .from("eventos")
    .select("nombre_novio_1, nombre_novio_2, nombre_evento")
    .eq("id", evento_id)
    .maybeSingle();

  const miembros = listErr ? [] : parseList(rawList);
  const titulo =
    [evento?.nombre_novio_1, evento?.nombre_novio_2].filter(Boolean).join(" & ") ||
    evento?.nombre_evento ||
    "Evento";

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        <Link href="/panel/evento" className="text-teal-400 hover:text-teal-300">
          ← Configuración
        </Link>
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold text-white">Gestión de equipo</h1>
      <p className="mt-2 text-slate-400">
        Invita editores o personal del centro para <span className="text-slate-200">{titulo}</span>.
      </p>
      {listErr && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {listErr.message}
        </p>
      )}

      <EquipoPageClient
        eventoId={evento_id}
        initialMiembros={miembros}
        isAdmin={Boolean(isAdmin)}
      />
    </div>
  );
}
