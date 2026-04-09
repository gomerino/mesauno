import { AdminEventosClient } from "@/components/admin/AdminEventosClient";

export default function AdminEventosPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Eventos</h1>
      <p className="mt-2 text-slate-400">
        Alta de eventos y gestores: ejecuta en Supabase la migración{" "}
        <code className="rounded bg-white/10 px-1 text-teal-300">migrate_parejas_a_eventos.sql</code> si venías de{" "}
        <code className="rounded bg-white/10 px-1 text-teal-300">parejas</code>.
      </p>
      <div className="mt-10">
        <AdminEventosClient />
      </div>
    </>
  );
}
