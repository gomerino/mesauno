import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProveedorPanelTabs } from "@/components/proveedores/ProveedorPanelTabs";
import {
  labelCategoria,
  labelRegion,
  listarServiciosProveedorPropio,
  listarSolicitudesRecibidasProveedor,
  obtenerProveedorPropio,
} from "@/lib/proveedores";
import type { ProveedorMedio } from "@/types/database";
import { BannerEstado } from "./ProveedorEstadoBanner";

export default async function PanelProveedorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/proveedor");
  }

  const proveedor = await obtenerProveedorPropio(supabase, user.id);

  if (!proveedor) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-bold">
          Todavía no tienes un perfil de proveedor
        </h1>
        <p className="mt-4 text-slate-400">
          Regístrate en menos de 5 minutos para aparecer en el marketplace.
        </p>
        <Link
          href="/para-proveedores/registro"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200"
        >
          Comenzar registro
        </Link>
      </div>
    );
  }

  const { data: mediosRaw } = await supabase
    .from("proveedor_medios")
    .select("*")
    .eq("proveedor_id", proveedor.id)
    .order("orden", { ascending: true });
  const medios = (mediosRaw ?? []) as ProveedorMedio[];

  const [servicios, solicitudes] = await Promise.all([
    listarServiciosProveedorPropio(supabase, user.id),
    listarSolicitudesRecibidasProveedor(supabase, user.id),
  ]);

  return (
    <div className="space-y-6">
      <BannerEstado
        estado={proveedor.estado}
        motivoStored={proveedor.motivo_suspension}
        slug={proveedor.slug}
      />

      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-amber-200">
            {labelCategoria(proveedor.categoria_principal)} · {labelRegion(proveedor.region)}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
            {proveedor.nombre_negocio}
          </h1>
          {proveedor.eslogan && (
            <p className="mt-1 text-slate-300">{proveedor.eslogan}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/para-proveedores"
            className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 hover:border-white/30 hover:text-white"
          >
            Ver landing pública
          </Link>
          {proveedor.estado === "aprobado" && (
            <Link
              href={`/marketplace/${proveedor.slug}`}
              className="rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-200"
            >
              Ver mi perfil público →
            </Link>
          )}
        </div>
      </header>

      <ProveedorPanelTabs
        proveedor={proveedor}
        mediosInicial={medios}
        serviciosInicial={servicios}
        solicitudesInicial={solicitudes}
      />
    </div>
  );
}
