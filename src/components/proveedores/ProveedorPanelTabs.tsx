"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CAP_MEDIOS_FREE,
  CAP_SOLICITUDES_MES_FREE,
  PROVEEDOR_CATEGORIAS,
  PROVEEDOR_REGIONES,
  labelCategoria,
} from "@/lib/proveedores";
import type {
  Proveedor,
  ProveedorCategoria,
  ProveedorMedio,
  ProveedorServicio,
  ProveedorSolicitud,
  ProveedorSolicitudRangoPresupuesto,
} from "@/types/database";

type TabId = "perfil" | "servicios" | "fotos" | "solicitudes" | "plan";

const RANGO_SOL_LABEL: Partial<Record<ProveedorSolicitudRangoPresupuesto, string>> = {
  "lt-500k": "< $500.000",
  "500k-1m": "$500k – $1M",
  "1m-3m": "$1M – $3M",
  "gt-3m": "> $3M",
};

const CANAL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Correo",
  en_app: "En la app",
};

type Props = {
  proveedor: Proveedor;
  mediosInicial: ProveedorMedio[];
  serviciosInicial: ProveedorServicio[];
  solicitudesInicial: ProveedorSolicitud[];
};

export function ProveedorPanelTabs({
  proveedor: provInicial,
  mediosInicial,
  serviciosInicial,
  solicitudesInicial,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("perfil");
  const [proveedor, setProveedor] = useState(provInicial);
  const [medios, setMedios] = useState(mediosInicial);
  const [servicios, setServicios] = useState(serviciosInicial);
  const [solicitudes] = useState(solicitudesInicial);

  useEffect(() => {
    setProveedor(provInicial);
  }, [provInicial]);

  useEffect(() => {
    setMedios(mediosInicial);
  }, [mediosInicial]);

  useEffect(() => {
    setServicios(serviciosInicial);
  }, [serviciosInicial]);

  const bloqueado = proveedor.estado === "suspendido";

  const tabs = useMemo(
    () =>
      [
        { id: "perfil" as const, label: "Perfil" },
        { id: "servicios" as const, label: "Servicios" },
        { id: "fotos" as const, label: "Fotos" },
        { id: "solicitudes" as const, label: "Solicitudes" },
        { id: "plan" as const, label: "Plan" },
      ] as const,
    [],
  );

  return (
    <div className="space-y-6">
      {bloqueado && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          Tu perfil está suspendido. No puedes editar contenido hasta regularizar la situación.
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-amber-300 text-slate-950"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <PerfilEditor
          proveedor={proveedor}
          bloqueado={bloqueado}
          onGuardado={(p) => {
            setProveedor(p);
            router.refresh();
          }}
        />
      )}
      {tab === "servicios" && (
        <ServiciosEditor
          servicios={servicios}
          bloqueado={bloqueado}
          onActualizado={(next) => {
            setServicios(next);
            router.refresh();
          }}
        />
      )}
      {tab === "fotos" && (
        <FotosEditor
          proveedor={proveedor}
          medios={medios}
          bloqueado={bloqueado}
          onMediosChange={(next) => {
            setMedios(next);
            router.refresh();
          }}
        />
      )}
      {tab === "solicitudes" && <SolicitudesLista solicitudes={solicitudes} />}
      {tab === "plan" && <PlanCard proveedor={proveedor} />}
    </div>
  );
}

function PerfilEditor({
  proveedor,
  bloqueado,
  onGuardado,
}: {
  proveedor: Proveedor;
  bloqueado: boolean;
  onGuardado: (p: Proveedor) => void;
}) {
  const [nombre, setNombre] = useState(proveedor.nombre_negocio);
  const [eslogan, setEslogan] = useState(proveedor.eslogan ?? "");
  const [biografia, setBiografia] = useState(proveedor.biografia ?? "");
  const [region, setRegion] = useState(proveedor.region);
  const [ciudad, setCiudad] = useState(proveedor.ciudad ?? "");
  const [categoria, setCategoria] = useState(proveedor.categoria_principal);
  const [email, setEmail] = useState(proveedor.email ?? "");
  const [whatsapp, setWhatsapp] = useState(proveedor.whatsapp ?? "");
  const [instagram, setInstagram] = useState(proveedor.instagram ?? "");
  const [sitioWeb, setSitioWeb] = useState(proveedor.sitio_web ?? "");
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setNombre(proveedor.nombre_negocio);
    setEslogan(proveedor.eslogan ?? "");
    setBiografia(proveedor.biografia ?? "");
    setRegion(proveedor.region);
    setCiudad(proveedor.ciudad ?? "");
    setCategoria(proveedor.categoria_principal);
    setEmail(proveedor.email ?? "");
    setWhatsapp(proveedor.whatsapp ?? "");
    setInstagram(proveedor.instagram ?? "");
    setSitioWeb(proveedor.sitio_web ?? "");
  }, [proveedor]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setGuardando(true);
    try {
      const res = await fetch("/api/proveedores/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_negocio: nombre.trim(),
          eslogan: eslogan.trim() || null,
          biografia: biografia.trim() || null,
          region,
          ciudad: ciudad.trim() || null,
          categoria_principal: categoria,
          email: email.trim() || null,
          whatsapp: whatsapp.trim() || null,
          instagram: instagram.trim() || null,
          sitio_web: sitioWeb.trim() || null,
        }),
      });
      const json = (await res.json()) as { proveedor?: Proveedor; error?: string };
      if (!res.ok || !json.proveedor) {
        setMsg(json.error ?? "No se pudo guardar.");
        return;
      }
      setMsg("Cambios guardados.");
      onGuardado(json.proveedor);
    } catch {
      setMsg("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8">
      <h2 className="font-display text-lg font-semibold">Datos del perfil</h2>
      <form onSubmit={guardar} className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500">Nombre del negocio</label>
          <input
            className="input-jurnex mt-1 w-full"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={bloqueado}
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Eslogan</label>
          <input
            className="input-jurnex mt-1 w-full"
            value={eslogan}
            onChange={(e) => setEslogan(e.target.value)}
            disabled={bloqueado}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Historia / bio</label>
          <textarea
            className="input-jurnex mt-1 min-h-[120px] w-full resize-y"
            value={biografia}
            onChange={(e) => setBiografia(e.target.value)}
            disabled={bloqueado}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500">Categoría principal</label>
            <select
              className="input-jurnex mt-1 w-full"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Proveedor["categoria_principal"])}
              disabled={bloqueado}
            >
              {PROVEEDOR_CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Región</label>
            <select
              className="input-jurnex mt-1 w-full"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={bloqueado}
            >
              {PROVEEDOR_REGIONES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Ciudad</label>
          <input
            className="input-jurnex mt-1 w-full"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            disabled={bloqueado}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500">Email de contacto</label>
            <input
              type="email"
              className="input-jurnex mt-1 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={bloqueado}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">WhatsApp (E.164, ej. +56912345678)</label>
            <input
              className="input-jurnex mt-1 w-full"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={bloqueado}
              placeholder="+56912345678"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500">Instagram (usuario sin @)</label>
            <input
              className="input-jurnex mt-1 w-full"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              disabled={bloqueado}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Sitio web</label>
            <input
              className="input-jurnex mt-1 w-full"
              value={sitioWeb}
              onChange={(e) => setSitioWeb(e.target.value)}
              disabled={bloqueado}
            />
          </div>
        </div>
        {msg && <p className="text-sm text-amber-200">{msg}</p>}
        <button
          type="submit"
          disabled={bloqueado || guardando}
          className="rounded-full bg-amber-300 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </section>
  );
}

function ServiciosEditor({
  servicios,
  bloqueado,
  onActualizado,
}: {
  servicios: ProveedorServicio[];
  bloqueado: boolean;
  onActualizado: (s: ProveedorServicio[]) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<ProveedorCategoria>(
    PROVEEDOR_CATEGORIAS[0]?.value ?? "fotografia",
  );
  const [precio, setPrecio] = useState("");
  const [duracion, setDuracion] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/proveedores/me/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          categoria,
          precio_desde_clp: precio ? Number(precio) : null,
          duracion_min: duracion ? Number(duracion) : null,
        }),
      });
      const json = (await res.json()) as { servicio?: ProveedorServicio; error?: string };
      if (!res.ok || !json.servicio) {
        setErr(json.error ?? "No se pudo crear.");
        return;
      }
      onActualizado([...servicios, json.servicio]);
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setDuracion("");
    } catch {
      setErr("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    setErr(null);
    const res = await fetch(`/api/proveedores/me/servicios/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setErr(j.error ?? "No se pudo eliminar.");
      return;
    }
    onActualizado(servicios.filter((s) => s.id !== id));
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="font-display text-lg font-semibold">Tus servicios</h2>
        <ul className="mt-4 space-y-3">
          {servicios.length === 0 ? (
            <li className="text-sm text-slate-500">Aún no cargaste servicios.</li>
          ) : (
            servicios.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{s.nombre}</p>
                  <p className="text-xs text-slate-500">{labelCategoria(s.categoria)}</p>
                  {s.descripcion && <p className="mt-1 text-sm text-slate-400">{s.descripcion}</p>}
                  <div className="mt-2 text-xs text-slate-500">
                    {s.precio_desde_clp != null &&
                      `${Number(s.precio_desde_clp).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })} desde`}
                    {s.duracion_min != null && ` · ${s.duracion_min} min`}
                  </div>
                </div>
                {!bloqueado && (
                  <button
                    type="button"
                    onClick={() => eliminar(s.id)}
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {!bloqueado && (
        <form onSubmit={agregar} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="font-display text-base font-semibold">Agregar servicio</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Nombre</label>
              <input
                className="input-jurnex mt-1 w-full"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Categoría</label>
              <select
                className="input-jurnex mt-1 w-full"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ProveedorCategoria)}
              >
                {PROVEEDOR_CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Precio desde (CLP)</label>
              <input
                type="number"
                min={0}
                className="input-jurnex mt-1 w-full"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Duración aprox. (min)</label>
              <input
                type="number"
                min={0}
                className="input-jurnex mt-1 w-full"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Descripción</label>
              <textarea
                className="input-jurnex mt-1 min-h-[80px] w-full"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>
          {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            {loading ? "Guardando…" : "Agregar"}
          </button>
        </form>
      )}
    </section>
  );
}

function FotosEditor({
  proveedor,
  medios,
  bloqueado,
  onMediosChange,
}: {
  proveedor: Proveedor;
  medios: ProveedorMedio[];
  bloqueado: boolean;
  onMediosChange: (m: ProveedorMedio[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cap =
    proveedor.plan === "free"
      ? `Plan free: hasta ${CAP_MEDIOS_FREE} fotos`
      : "Plan premium: sin límite de fotos";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || bloqueado) return;
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("archivo", file);
      const res = await fetch("/api/proveedores/me/medios", { method: "POST", body: fd });
      const json = (await res.json()) as { medio?: ProveedorMedio; error?: string };
      if (!res.ok || !json.medio) {
        setErr(json.error ?? "No se pudo subir la foto.");
        return;
      }
      onMediosChange([...medios, json.medio]);
    } catch {
      setErr("Error de conexión.");
    } finally {
      setUploading(false);
    }
  }

  async function borrar(id: string) {
    if (!confirm("¿Eliminar esta foto?")) return;
    setErr(null);
    const res = await fetch(`/api/proveedores/me/medios/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setErr(j.error ?? "No se pudo eliminar.");
      return;
    }
    onMediosChange(medios.filter((m) => m.id !== id));
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Fotos ({medios.length})</h2>
        <p className="text-xs text-slate-500">{cap}</p>
      </div>
      {!bloqueado && (
        <div className="mt-4">
          <label className="inline-flex cursor-pointer rounded-full bg-amber-300/20 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/30">
            {uploading ? "Subiendo…" : "Subir foto"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {medios.map((m, idx) => (
          <div key={m.id} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url_publica} alt="" className="h-full w-full object-cover" />
            {idx === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold text-slate-950">
                PORTADA
              </span>
            )}
            {!bloqueado && (
              <button
                type="button"
                onClick={() => borrar(m.id)}
                className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white hover:bg-black/80"
              >
                Quitar
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SolicitudesLista({ solicitudes }: { solicitudes: ProveedorSolicitud[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8">
      <h2 className="font-display text-lg font-semibold">Solicitudes de contacto</h2>
      <p className="mt-1 text-sm text-slate-500">
        Mensajes que las parejas envían desde el marketplace. No mostramos datos personales del remitente
        en esta versión.
      </p>
      <ul className="mt-4 space-y-3">
        {solicitudes.length === 0 ? (
          <li className="text-sm text-slate-500">Todavía no tienes solicitudes.</li>
        ) : (
          solicitudes.map((s) => (
            <li key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>{CANAL_LABEL[s.canal] ?? s.canal}</span>
                <time dateTime={s.created_at}>
                  {new Date(s.created_at).toLocaleString("es-CL", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              {s.mensaje && <p className="mt-2 text-slate-200">{s.mensaje}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                {s.fecha_evento_contexto && <span>Fecha referencia: {s.fecha_evento_contexto}</span>}
                {s.region_contexto && <span> · {s.region_contexto}</span>}
                {s.rango_presupuesto && (
                  <span> · Presupuesto: {RANGO_SOL_LABEL[s.rango_presupuesto] ?? s.rango_presupuesto}</span>
                )}
                {s.limitado_por_plan && (
                  <span className="text-amber-200"> · Límite de plan del profesional</span>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function PlanCard({ proveedor }: { proveedor: Proveedor }) {
  const usado = proveedor.solicitudes_mes;
  const limite = CAP_SOLICITUDES_MES_FREE;
  const cerca = proveedor.plan === "free" && usado >= Math.ceil((limite * 2) / 3);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8">
      <h2 className="font-display text-lg font-semibold">Plan</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div
          className={`rounded-2xl border p-4 ${proveedor.plan === "free" ? "border-amber-400/40 bg-amber-400/5" : "border-white/10"}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Free</p>
          <p className="mt-2 text-sm text-slate-300">
            Hasta {limite} solicitudes de contacto por mes (referencia) y {CAP_MEDIOS_FREE} fotos en el
            portafolio.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Uso reciente (contador mensual): <strong>{usado}</strong>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Premium</p>
          <p className="mt-2 text-sm text-slate-400">
            Más visibilidad, fotos sin límite y herramientas avanzadas. Próximamente: contratación en la
            app.
          </p>
        </div>
      </div>
      {cerca && (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          Estás cerca del límite de solicitudes del plan Free. Cuando activemos el upgrade, podrás pasar a
          Premium desde aquí.
        </p>
      )}
      <p className="mt-4 text-xs text-slate-600">
        El slug público <code className="text-slate-400">/marketplace/{proveedor.slug}</code> no cambia al
        editar el nombre.
      </p>
    </section>
  );
}
