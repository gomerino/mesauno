import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function InvitacionNotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-white">Invitación no encontrada</h1>
        <p className="mt-4 text-slate-400">Comprueba el enlace o el token en Supabase.</p>
        <Link href="/" className="mt-8 inline-block text-teal-400 hover:underline">
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
