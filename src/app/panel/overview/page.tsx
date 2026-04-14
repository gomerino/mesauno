import { CouplePageHeader } from "@/components/app/CouplePageHeader";
import { createClient } from "@/lib/supabase/server";
import { InvitacionMetricasCard } from "@/components/panel/InvitacionMetricasCard";
import { PanelSetupSection } from "@/components/panel/PanelSetupSection";
import type { PanelChecklistRow } from "@/components/panel/PanelSetupSection";
import {
  loadPanelProgressBundle,
  panelGrowthLine,
  panelNextActionHref,
} from "@/lib/panel-progress-load";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PanelOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const bundle = await loadPanelProgressBundle(supabase, user!.id);
  const { pct, steps, evento, invitados: inv } = bundle;

  const totalInv = inv.length;
  const confirmados = inv.filter((r) => r.rsvp_estado === "confirmado").length;
  const emailsEnviados = inv.filter((r) => r.email_enviado === true).length;
  const invitacionesVistas = inv.filter((r) => r.invitacion_vista === true).length;

  let totalAportes = 0;
  if (evento) {
    const { data: apRows, error: apErr } = await supabase
      .from("aportes_regalo")
      .select("monto")
      .eq("evento_id", evento.id);

    if (!apErr && apRows) {
      totalAportes = apRows.reduce((s, r) => s + Number(r.monto ?? 0), 0);
    }
  }

  const growthHint = panelGrowthLine(pct, steps);
  const continueHref = panelNextActionHref(steps, pct);

  const checklistRows: PanelChecklistRow[] = [
    {
      id: "evento",
      title: "Datos del evento",
      description: steps.evento
        ? "Nombre de ambos y fecha: listo."
        : "Lo primero: cómo os presentáis y cuándo es la celebración.",
      done: steps.evento,
      href: "/panel/evento",
      ctaLabel: steps.evento ? "Editar evento" : "Completar datos",
    },
    {
      id: "invitados",
      title: "Lista de invitados",
      description: steps.invitados
        ? "Ya hay personas en tu lista."
        : "Añade a quien quieras invitar; luego podrás enviar la invitación.",
      done: steps.invitados,
      href: "/panel/invitados",
      ctaLabel: steps.invitados ? "Agregar más invitados" : "Agregar invitados",
    },
    {
      id: "compartir",
      title: "Compartir la invitación",
      description: steps.compartir
        ? "Alguien ya vio la invitación o recibió un correo."
        : "Envía el enlace o un correo para que confirmen.",
      done: steps.compartir,
      href: "/panel/invitados/vista",
      ctaLabel: steps.compartir ? "Ver invitación" : "Ver y compartir",
    },
  ];

  return (
    <>
      <CouplePageHeader
        eyebrow="Inicio"
        title="Completa tu evento en 3 pasos"
        titleClassName="text-2xl sm:text-3xl"
        subtitle={
          <>
            <span className="block text-sm text-slate-500 md:hidden">
              {pct >= 100
                ? "Podéis seguir puliendo detalles cuando queráis."
                : "Datos, invitados y compartir: vamos paso a paso."}
            </span>
            {pct < 100 ? (
              <span className="hidden text-slate-300 md:block">{growthHint}</span>
            ) : (
              <span className="hidden text-slate-300 md:block">
                ¡Lleváis el ritmo perfecto! Seguid afinando programa, equipo o finanzas cuando queráis.
              </span>
            )}
            <span className="mt-2 hidden text-slate-500 md:block">
              Abajo tienes el plan en tres pasos y un vistazo rápido a invitados y confirmaciones.
            </span>
          </>
        }
      />

      <div className="mt-6 hidden md:block">
        <Link
          href={continueHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-teal-500 px-6 text-sm font-semibold text-white shadow-md shadow-teal-950/25 transition hover:bg-teal-400"
        >
          Continuar con tu evento
        </Link>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-400/90">
              Siguiente paso
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
          <p className="mt-2 text-sm leading-snug text-slate-400">{growthHint}</p>
        </div>
        <Link
          href={continueHref}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-teal-500 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-950/30 transition hover:bg-teal-400 active:scale-[0.99]"
        >
          Continuar con tu evento
        </Link>
      </div>

      <PanelSetupSection pct={pct} rows={checklistRows} hideIntroOnMobile />

      {evento && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumen</p>
          <p className="mt-2 text-lg text-white">
            {evento.nombre_novio_1} & {evento.nombre_novio_2}
          </p>
          {evento.fecha_boda && (
            <p className="mt-2 text-sm text-slate-400">Fecha: {String(evento.fecha_boda)}</p>
          )}
          <Link
            href="/panel/evento"
            className="mt-4 inline-flex items-center rounded-full bg-teal-500/20 px-4 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-500/30"
          >
            Editar evento →
          </Link>
        </div>
      )}

      {evento && (
        <div className="mt-10">
          <InvitacionMetricasCard
            eventoId={evento.id}
            totalInvitados={totalInv}
            emailsEnviados={emailsEnviados}
            invitacionesVistas={invitacionesVistas}
          />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Invitados</p>
          <p className="font-display mt-2 text-3xl font-bold text-white">{totalInv}</p>
          <Link
            href="/panel/invitados"
            className="mt-3 inline-flex text-sm font-semibold text-teal-300 hover:text-teal-200"
          >
            Agregar invitados →
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Confirmaciones</p>
          <p className="font-display mt-2 text-3xl font-bold text-teal-300">{confirmados}</p>
          <Link
            href="/panel/invitados/confirmaciones"
            className="mt-3 inline-flex text-sm font-semibold text-teal-300 hover:text-teal-200"
          >
            Ver quién respondió →
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Regalos (aportes)</p>
          <p className="font-display mt-2 text-2xl font-bold text-orange-300">
            {evento
              ? totalAportes.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
              : "—"}
          </p>
          <Link href="/panel/finanzas" className="mt-3 inline-flex text-sm font-semibold text-teal-300 hover:text-teal-200">
            Ir a finanzas →
          </Link>
          {!evento && (
            <p className="mt-2 text-xs text-slate-500">Crea el evento para llevar la cuenta.</p>
          )}
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-slate-500">
        ¿Proveedores o inspiración?{" "}
        <Link href="/marketplace" className="font-medium text-teal-300 hover:text-teal-200">
          Explorar marketplace
        </Link>
      </p>
    </>
  );
}
