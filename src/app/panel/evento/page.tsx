import { EventoForm } from "@/components/panel/EventoForm";
import { selectEventoForMember } from "@/lib/evento-membership";
import { isEventBasicsComplete } from "@/lib/panel-setup-progress";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import type { Evento } from "@/types/database";
import Link from "next/link";

function pickWelcome(raw: Record<string, string | string[] | undefined> | undefined): boolean {
  if (!raw) return false;
  const v = raw.welcome;
  const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  return s === "1" || s === "true";
}

export default async function PanelEventoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const showWelcomeBanner = pickWelcome(searchParams);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "*");
  const { pct } = await loadPanelProgressBundle(user!.id);

  const eventoForProgress = (evento ?? null) as Evento | null;
  const basicsDone = isEventBasicsComplete(eventoForProgress);

  return (
    <div className="mx-auto w-full max-w-4xl">
      {showWelcomeBanner ? (
        <div
          className="mb-4 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-50"
          role="status"
        >
          <span className="font-medium text-white">¡Bienvenidos!</span> Completá los datos de abajo para seguir con
          tu viaje.
        </div>
      ) : null}

      <header className="border-b border-white/[0.06] pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-400/80">Tu evento</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Tu destino</h1>
        <p className="mt-1 text-sm text-slate-400">Lo esencial para que invitados y programa hablen el mismo idioma.</p>
        <p className="mt-2">
          <Link href="/panel" className="text-xs font-medium text-teal-400 hover:text-teal-300">
            ✨ {pct}% listo · Ver resumen
          </Link>
        </p>
      </header>

      {!basicsDone ? (
        <p className="mt-3 text-xs text-slate-500" role="status">
          Falta: nombres de ambos y fecha para marcar el destino como listo.
        </p>
      ) : null}

      <div className="mt-4">
        <EventoForm initial={(evento ?? null) as Evento | null} />
      </div>

      <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4 text-xs" aria-label="Ir a otros módulos">
        <Link href="/panel/programa" className="text-teal-400/90 hover:text-teal-300">
          Programa
        </Link>
        <Link href="/panel/invitacion" className="text-teal-400/90 hover:text-teal-300">
          Invitaciones
        </Link>
        <Link href="/panel/experiencia" className="text-teal-400/90 hover:text-teal-300">
          Experiencia
        </Link>
      </nav>
    </div>
  );
}
