import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-4 inline-block rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-1 text-sm text-teal-200">
          Plataforma de matrimonios
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Tu gran día merece un <span className="text-orange-400">despegue</span> memorable
        </h1>
        <p className="mt-6 text-lg text-slate-300">
          Invitaciones estilo boarding pass, RSVP con restricciones alimenticias, regalos y un
          marketplace de proveedores — todo con Next.js 14 y Supabase.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/marketplace"
            className="rounded-full bg-teal-500 px-8 py-3 font-semibold text-white shadow-lg shadow-teal-900/40 transition hover:bg-teal-400"
          >
            Ver marketplace
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-8 py-3 font-semibold text-white hover:bg-white/10"
          >
            Acceder al panel
          </Link>
        </div>
        <p className="mt-12 text-sm text-slate-500">
          Demo: usa una URL de invitación <code className="text-teal-400">/invitacion/[id]</code> con un UUID
          de invitado en Supabase.
        </p>
      </main>
    </div>
  );
}
