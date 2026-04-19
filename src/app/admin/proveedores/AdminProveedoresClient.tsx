"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  labelCategoria,
  labelRegion,
  MOTIVOS_SUSPENSION,
  type MotivoSuspension,
  type AdminProveedorListaItem,
} from "@/lib/proveedores";
import type { ProveedorEstado } from "@/types/database";

type ItemConMotivo = AdminProveedorListaItem & {
  motivo_parsed: {
    motivo: MotivoSuspension | null;
    detalle: string | null;
  };
};

export function AdminProveedoresClient({
  items,
  estadoActivo,
  adminConfigurado,
}: {
  items: ItemConMotivo[];
  estadoActivo: ProveedorEstado;
  adminConfigurado: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [suspendiendo, setSuspendiendo] = useState<ItemConMotivo | null>(null);

  const accion = async (
    id: string,
    tipo: "aprobar" | "suspender",
    body?: { motivo: MotivoSuspension; detalle?: string | null },
  ) => {
    setLoadingId(id);
    setErrorGlobal(null);
    try {
      const res = await fetch(`/api/admin/proveedores/${id}/${tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : JSON.stringify({}),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || `Error ${res.status}`);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      setErrorGlobal(
        e instanceof Error ? e.message : "No pudimos completar la acción.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Proveedores</h1>
          <p className="mt-1 text-xs text-slate-500">
            Revisión manual del marketplace (SLA objetivo 48h).
          </p>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {(["pendiente", "aprobado", "suspendido"] as ProveedorEstado[]).map(
            (e) => (
              <Link
                key={e}
                href={`/admin/proveedores?estado=${e}`}
                className={`rounded-full px-3 py-1.5 transition ${
                  e === estadoActivo
                    ? "bg-amber-300 text-slate-950"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {labelEstado(e)}
              </Link>
            ),
          )}
        </nav>
      </header>

      {!adminConfigurado && (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
          ⚠️ Falta <code>SUPABASE_SERVICE_ROLE_KEY</code>. Sin service role no
          es posible ver los proveedores pendientes.
        </div>
      )}

      {errorGlobal && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {errorGlobal}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-400">
          Sin proveedores en estado {labelEstado(estadoActivo)}.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => (
            <li
              key={p.id}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 md:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-amber-200">
                    {labelCategoria(p.categoria_principal)} ·{" "}
                    {labelRegion(p.region)}
                    {p.plan === "premium" && " · Premium"}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold">
                    {p.nombre_negocio}
                  </h2>
                  {p.eslogan && (
                    <p className="mt-1 text-sm text-slate-300">{p.eslogan}</p>
                  )}
                  <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-slate-400 sm:grid-cols-2">
                    <div>
                      <dt className="inline text-slate-500">Email:</dt>{" "}
                      <dd className="inline text-slate-200">
                        {p.email ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">WhatsApp:</dt>{" "}
                      <dd className="inline text-slate-200">
                        {p.whatsapp ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">Slug:</dt>{" "}
                      <dd className="inline text-slate-200">{p.slug}</dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">Fotos:</dt>{" "}
                      <dd className="inline text-slate-200">
                        {p.medios_count}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">Creado:</dt>{" "}
                      <dd className="inline text-slate-200">
                        {new Date(p.created_at).toLocaleString("es-CL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </dd>
                    </div>
                  </dl>

                  {p.estado === "suspendido" && p.motivo_parsed.motivo && (
                    <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                      Motivo:{" "}
                      {MOTIVOS_SUSPENSION.find(
                        (m) => m.value === p.motivo_parsed.motivo,
                      )?.label ?? p.motivo_parsed.motivo}
                      {p.motivo_parsed.detalle ? (
                        <>
                          <br />
                          {p.motivo_parsed.detalle}
                        </>
                      ) : null}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-start gap-2 md:flex-col md:items-stretch">
                  <Link
                    href={`/marketplace/${p.slug}`}
                    target="_blank"
                    className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 hover:border-white/30"
                  >
                    Ver perfil
                  </Link>
                  {p.estado !== "aprobado" && (
                    <button
                      type="button"
                      disabled={loadingId === p.id || pending}
                      onClick={() => accion(p.id, "aprobar")}
                      className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
                    >
                      {loadingId === p.id ? "…" : "Aprobar"}
                    </button>
                  )}
                  {p.estado !== "suspendido" && (
                    <button
                      type="button"
                      disabled={loadingId === p.id || pending}
                      onClick={() => setSuspendiendo(p)}
                      className="rounded-full border border-rose-500/40 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
                    >
                      Suspender
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {suspendiendo && (
        <ModalSuspender
          item={suspendiendo}
          loading={loadingId === suspendiendo.id}
          onCancel={() => setSuspendiendo(null)}
          onConfirm={async (motivo, detalle) => {
            await accion(suspendiendo.id, "suspender", { motivo, detalle });
            setSuspendiendo(null);
          }}
        />
      )}
    </div>
  );
}

function ModalSuspender({
  item,
  loading,
  onCancel,
  onConfirm,
}: {
  item: ItemConMotivo;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (motivo: MotivoSuspension, detalle: string | null) => void;
}) {
  const [motivo, setMotivo] = useState<MotivoSuspension>("incompleto");
  const [detalle, setDetalle] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 className="font-display text-lg font-semibold">
          Suspender {item.nombre_negocio}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          El proveedor recibirá un correo con el motivo y podrá editar su
          perfil para volver a revisión.
        </p>

        <label className="mt-5 block text-sm">
          <span className="text-slate-200">Motivo</span>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoSuspension)}
            className="input-jurnex mt-1"
          >
            {MOTIVOS_SUSPENSION.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} — {m.descripcion}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm">
          <span className="text-slate-200">
            Detalle{" "}
            <span className="text-xs font-normal text-slate-500">(opcional)</span>
          </span>
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            className="input-jurnex mt-1 min-h-24"
            placeholder="Ej.: las fotos están fuera de foco. Cámbialas y avísanos."
            maxLength={280}
          />
        </label>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-sm text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(motivo, detalle.trim() || null)}
            disabled={loading}
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
          >
            {loading ? "Suspendiendo…" : "Confirmar suspensión"}
          </button>
        </div>
      </div>
    </div>
  );
}

function labelEstado(e: ProveedorEstado): string {
  switch (e) {
    case "pendiente":
      return "Pendientes";
    case "aprobado":
      return "Aprobados";
    case "suspendido":
      return "Suspendidos";
  }
}
