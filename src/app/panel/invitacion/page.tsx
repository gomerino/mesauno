import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { PanelSubpageChrome } from "@/components/panel/PanelSubpageChrome";
import { loadPanelProgressBundle } from "@/lib/panel-progress-load";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PanelInvitacionHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const bundle = await loadPanelProgressBundle(supabase, user!.id);
  const { steps, evento, invitados } = bundle;

  const firstToken = invitados.find((i) => i.token_acceso?.trim())?.token_acceso?.trim();
  const invitacionPublicaHref = firstToken ? `/invitacion/${firstToken}` : null;

  type Estado = "no_evento" | "sin_invitados" | "lista" | "compartida";
  let estado: Estado;
  if (!evento) {
    estado = "no_evento";
  } else if (!steps.invitados) {
    estado = "sin_invitados";
  } else if (!steps.invitacion_compartida) {
    estado = "lista";
  } else {
    estado = "compartida";
  }

  const estadoTitulo =
    estado === "no_evento"
      ? "No creada"
      : estado === "sin_invitados"
        ? "Pendiente de invitados"
        : estado === "lista"
          ? "Lista"
          : "Compartida";

  const estadoTexto =
    estado === "no_evento"
      ? "Primero creá la ficha del evento con nombres y fecha."
      : estado === "sin_invitados"
        ? "Añadí al menos una persona en tu lista para generar su enlace de invitación."
        : estado === "lista"
          ? "Tu invitación está lista. Podés verla y compartirla cuando quieras."
          : "Ya hubo correos enviados o alguien abrió el enlace.";

  const primaryHref =
    estado === "no_evento"
      ? "/panel/evento"
      : estado === "sin_invitados"
        ? "/panel/invitados"
        : invitacionPublicaHref ?? "/panel/invitados/vista";

  const primaryLabel =
    estado === "no_evento"
      ? "Completar evento"
      : estado === "sin_invitados"
        ? "Agregar invitados"
        : invitacionPublicaHref
          ? "Ver invitación"
          : "Vista previa";

  return (
    <PanelSubpageChrome>
      <CouplePageHeader
        eyebrow="Invitación"
        title="Tu invitación"
        subtitle="Estado y accesos. El diseño público sigue igual; aquí solo ves el resumen y los enlaces."
      />

      <div className="mt-6 md:hidden">
        <Link
          href={primaryHref}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-teal-500 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 transition hover:bg-teal-400"
        >
          {primaryLabel}
        </Link>
      </div>

      <div
        className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 md:mt-8"
        role="status"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-400/90">Estado</p>
        <p className="mt-1 font-display text-xl font-semibold text-white">{estadoTitulo}</p>
        <p className="mt-2 text-sm text-slate-400">{estadoTexto}</p>
      </div>

      <div className="mt-6 hidden md:block">
        <Link
          href={primaryHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-teal-500 px-6 text-sm font-semibold text-white shadow-md hover:bg-teal-400"
        >
          {primaryLabel}
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {invitacionPublicaHref ? (
          <Link
            href={invitacionPublicaHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Abrir invitación pública
          </Link>
        ) : (
          <Link
            href="/invitacion/demo"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Ver demo de invitación
          </Link>
        )}
        <Link
          href="/panel/invitados/vista"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-teal-500/40 px-5 text-sm font-semibold text-teal-200 hover:bg-teal-500/10"
        >
          Compartir desde el panel
        </Link>
      </div>
    </PanelSubpageChrome>
  );
}
