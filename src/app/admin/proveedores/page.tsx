import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { createStrictServiceClient } from "@/lib/supabase/server";
import {
  listarProveedoresAdmin,
  parseMotivoSuspension,
} from "@/lib/proveedores";
import type { ProveedorEstado } from "@/types/database";
import { AdminProveedoresClient } from "./AdminProveedoresClient";

type Props = {
  searchParams: Promise<{ estado?: string }>;
};

function esEstadoValido(v: string | undefined): v is ProveedorEstado {
  return v === "pendiente" || v === "aprobado" || v === "suspendido";
}

export default async function AdminProveedoresPage({ searchParams }: Props) {
  const user = await getAdminSessionUser();
  if (!user) {
    redirect("/panel");
  }

  const { estado: raw } = await searchParams;
  const estado: ProveedorEstado = esEstadoValido(raw) ? raw : "pendiente";

  const admin = await createStrictServiceClient();
  const items = admin ? await listarProveedoresAdmin(admin, { estado }) : [];

  const enriquecidos = items.map((p) => {
    const parsed = parseMotivoSuspension(p.motivo_suspension);
    return { ...p, motivo_parsed: parsed };
  });

  return (
    <AdminProveedoresClient
      items={enriquecidos}
      estadoActivo={estado}
      adminConfigurado={Boolean(admin)}
    />
  );
}
