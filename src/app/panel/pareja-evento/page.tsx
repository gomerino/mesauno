import { createClient } from "@/lib/supabase/server";
import { ParejaEventoForm } from "@/components/panel/ParejaEventoForm";
import type { Pareja } from "@/types/database";
import Link from "next/link";

export default async function ParejaEventoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pareja } = await supabase.from("parejas").select("*").eq("user_id", user!.id).maybeSingle();

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-white">Pareja y evento</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        Configura los datos de los novios y del evento una sola vez. Se aplican a todas las
        invitaciones, el boarding pass y el mensaje sobre el RSVP. Los invitados solo guardan su
        nombre, contacto y acompañantes en{" "}
        <Link href="/panel/invitados" className="text-teal-300 underline hover:text-teal-200">
          Crear invitados
        </Link>
        .
      </p>

      <div className="mt-10">
        <ParejaEventoForm initial={(pareja ?? null) as Pareja | null} userId={user!.id} />
      </div>
    </>
  );
}
