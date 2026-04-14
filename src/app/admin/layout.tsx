import { isAdminEmail } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/eventos");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/panel/overview");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-8">
        <div>
          <Link href="/admin/eventos" className="font-display text-lg font-bold tracking-tight">
            Administración
          </Link>
          <p className="mt-0.5 text-xs text-slate-500">Solo gestores de plataforma (crear eventos y miembros)</p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/admin/eventos"
            className="font-medium text-amber-400/90 hover:text-amber-300"
          >
            Eventos y usuarios
          </Link>
          <Link href="/" className="text-slate-500 hover:text-slate-300">
            Inicio
          </Link>
        </nav>
      </header>
      <div className="mx-auto max-w-5xl p-4 md:p-8">{children}</div>
    </div>
  );
}
