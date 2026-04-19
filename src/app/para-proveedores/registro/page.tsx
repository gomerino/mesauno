import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerProveedorPropio } from "@/lib/proveedores";
import { RegistroProveedorFlow } from "@/components/proveedores/RegistroProveedorFlow";

export const metadata: Metadata = {
  title: "Registrarme como proveedor · Jurnex",
  description:
    "Únete al marketplace de matrimonios. Registro autoservicio en 3 pasos.",
};

export default async function RegistroProveedorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const proveedor = await obtenerProveedorPropio(supabase, user.id);
    if (proveedor) {
      redirect("/proveedor");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <RegistroProveedorFlow userEmail={user?.email ?? null} />
    </main>
  );
}
