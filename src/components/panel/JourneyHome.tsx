import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { createClient } from "@/lib/supabase/server";
import { PanelSetupSection } from "@/components/panel/PanelSetupSection";
import type { PanelChecklistRow } from "@/components/panel/PanelSetupSection";
import { PanelThemeSelector } from "@/components/panel/PanelThemeSelector";
import {
  journeyHeadline,
  loadPanelProgressBundle,
  panelNextActionHref,
  panelNextActionLabel,
} from "@/lib/panel-progress-load";
import Link from "next/link";

export async function JourneyHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const bundle = await loadPanelProgressBundle(supabase, user!.id);
  const { pct, steps, nextStep, remainingSteps, evento } = bundle;

  const headline = journeyHeadline(nextStep, remainingSteps);
  const continueHref = panelNextActionHref(nextStep);
  const continueLabel = panelNextActionLabel(nextStep);

  const checklistRows: PanelChecklistRow[] = [
    {
      id: "evento",
      title: "Tu evento listo",
      description: steps.evento
        ? "Nombre de ambos y fecha: hecho."
        : "Lo primero: cómo os presentáis y cuándo celebráis.",
      done: steps.evento,
      href: "/panel/evento",
      ctaLabel: steps.evento ? "Editar datos" : "Completar datos",
    },
    {
      id: "invitados",
      title: "Invitados",
      description: steps.invitados
        ? "Ya hay alguien en tu lista."
        : "Añade al menos una persona para generar su invitación.",
      done: steps.invitados,
      href: "/panel/invitados",
      ctaLabel: steps.invitados ? "Gestionar lista" : "Agregar invitados",
    },
    {
      id: "invitacion_lista",
      title: "Invitación lista",
      description: steps.invitacion_lista
        ? "Podéis verla y revisarla cuando queráis."
        : "Cuando el evento y la lista estén listos, aquí verás el estado.",
      done: steps.invitacion_lista,
      href: "/panel/invitacion",
      ctaLabel: steps.invitacion_lista ? "Ver estado" : "Ir a invitación",
    },
    {
      id: "invitacion_compartida",
      title: "Invitación compartida",
      description: steps.invitacion_compartida
        ? "Alguien ya recibió correo o abrió el enlace."
        : "Envía el enlace o un correo para que confirmen.",
      done: steps.invitacion_compartida,
      href: "/panel/invitacion",
      ctaLabel: steps.invitacion_compartida ? "Ver invitación" : "Compartir",
    },
    {
      id: "seguimiento",
      title: "Seguimiento",
      description: steps.seguimiento
        ? "Ya hay respuestas o interacción en la lista."
        : "Cuando alguien confirme o decline, lo verás aquí.",
      done: steps.seguimiento,
      href: "/panel/invitados/confirmaciones",
      ctaLabel: steps.seguimiento ? "Ver respuestas" : "Ver confirmaciones",
    },
  ];

  return (
    <>
      <CouplePageHeader
        eyebrow="Tu gran día"
        title={nextStep == null ? "Todo el camino principal está listo" : "Tu evento, paso a paso"}
        titleClassName="text-2xl sm:text-3xl"
        subtitle={
          <>
            <span className="block text-sm text-slate-500 md:hidden">
              {nextStep == null
                ? "Seguid afinando programa, equipo o finanzas cuando queráis."
                : "Un solo foco cada vez: el siguiente paso es lo importante."}
            </span>
            <span className="hidden text-slate-300 md:block">{headline}</span>
          </>
        }
      />

      <div className="mt-6 hidden md:block">
        <Link
          href={continueHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-teal-500 px-6 text-sm font-semibold text-white shadow-md shadow-teal-950/25 transition hover:bg-teal-400"
        >
          {continueLabel}
        </Link>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-400/90">
              Progreso
            </span>
            <span className="font-display text-xl font-bold tabular-nums text-white">{pct}%</span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm leading-snug text-slate-300">{headline}</p>
        </div>
        <Link
          href={continueHref}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-teal-500 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 transition hover:bg-teal-400 active:scale-[0.99]"
        >
          {continueLabel}
        </Link>
      </div>

      <PanelSetupSection pct={pct} rows={checklistRows} hideIntroOnMobile />

      {evento && (
        <p className="mt-8 text-center text-sm text-slate-500">
          <span className="text-slate-400">
            {evento.nombre_novio_1} & {evento.nombre_novio_2}
            {evento.fecha_boda ? ` · ${String(evento.fecha_boda)}` : ""}
          </span>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/panel/evento" className="font-medium text-teal-300 hover:text-teal-200">
            Editar ficha
          </Link>
        </p>
      )}

      <div className="mt-10 border-t border-white/10 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Después del camino principal</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>
            <Link href="/panel/programa" className="text-teal-300 hover:text-teal-200">
              Programa del día
            </Link>
          </li>
          <li>
            <Link href="/panel/equipo" className="text-teal-300 hover:text-teal-200">
              Equipo
            </Link>
          </li>
          <li>
            <Link href="/panel/finanzas" className="text-teal-300 hover:text-teal-200">
              Finanzas y regalos
            </Link>
          </li>
          <li>
            <Link href="/marketplace" className="text-teal-300 hover:text-teal-200">
              Marketplace
            </Link>
          </li>
        </ul>
      </div>

      <PanelThemeSelector />
    </>
  );
}
