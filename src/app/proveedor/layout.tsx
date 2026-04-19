import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProveedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/proveedor");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <Link
              href="/proveedor"
              className="font-display text-lg font-bold tracking-tight"
            >
              Jurnex · Proveedor
            </Link>
            <p className="mt-0.5 text-xs text-slate-500">
              Tu perfil en el marketplace
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/marketplace" className="text-slate-400 hover:text-white">
              Ver marketplace
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white">
              Inicio
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8 md:py-12">{children}</main>
    </div>
  );
}
