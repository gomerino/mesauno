"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "sonner";
import { useEffect, useMemo } from "react";

export type StaffEventoOption = {
  id: string;
  nombre_evento: string | null;
  nombre_novio_1: string | null;
  nombre_novio_2: string | null;
};

type Props = {
  eventoIds: string[];
  eventos: StaffEventoOption[];
  userEmail: string;
  children: React.ReactNode;
};

function labelEvento(e: StaffEventoOption) {
  const n = [e.nombre_novio_1, e.nombre_novio_2].filter(Boolean).join(" & ");
  if (n) return n;
  return e.nombre_evento?.trim() || "Evento";
}

export function StaffAppShell({ eventoIds, eventos, userEmail, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventoParam = searchParams.get("evento");

  const activeEventoId = useMemo(() => {
    if (eventoParam && eventoIds.includes(eventoParam)) return eventoParam;
    return eventoIds[0] ?? "";
  }, [eventoParam, eventoIds]);

  useEffect(() => {
    if (eventoIds.length === 0) return;
    const first = eventoIds[0];
    if (!eventoParam || !eventoIds.includes(eventoParam)) {
      router.replace(`${pathname}?evento=${encodeURIComponent(first)}`);
    }
  }, [eventoIds, eventoParam, pathname, router]);

  function setEvento(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("evento", id);
    router.push(`${pathname}?${next.toString()}`);
  }

  const qs = activeEventoId ? `?evento=${encodeURIComponent(activeEventoId)}` : "";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 pb-24 text-white">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-bold tracking-tight text-white">Mesa Uno · Staff</p>
            <span className="max-w-[12rem] truncate text-[10px] text-slate-500">{userEmail}</span>
          </div>
          {eventos.length > 0 && (
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wide text-slate-500">
              Evento
              <select
                value={activeEventoId}
                onChange={(e) => setEvento(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {eventos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {labelEvento(e)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-white/10 bg-slate-950/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link
          href={`/staff/check-in${qs}`}
          className={`flex-1 rounded-xl py-3 text-center text-sm font-semibold ${
            pathname === "/staff/check-in" ? "bg-[#001d66] text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Escanear
        </Link>
        <Link
          href={`/staff/mesas${qs}`}
          className={`flex-1 rounded-xl py-3 text-center text-sm font-semibold ${
            pathname === "/staff/mesas" ? "bg-[#001d66] text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Lista
        </Link>
      </nav>
    </div>
  );
}
