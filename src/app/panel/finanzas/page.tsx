import { PanelPageContainer } from "@/components/panel/PanelPageContainer";
import { PanelPageHeader } from "@/components/panel/PanelPageHeader";
import { PanelSubpageProgress } from "@/components/panel/PanelSubpageProgress";
import { createClient } from "@/lib/supabase/server";
import { selectEventoForMember } from "@/lib/evento-membership";
import { AportesManager } from "@/components/panel/AportesManager";
import { fetchInvitadosPanelRows } from "@/lib/panel-invitados";
import type { AporteRegalo, Invitado } from "@/types/database";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pagoBanner(pago: string | undefined) {
  if (pago === "exitoso") {
    return (
      <div
        className="mb-6 rounded-xl border border-teal-500/35 bg-teal-500/15 px-4 py-3 text-sm text-teal-50"
        role="status"
      >
        <strong className="font-semibold text-white">Pago recibido.</strong> Estamos confirmando tu suscripción; si no ves
        el cambio en unos minutos, recargá esta página o el inicio.
      </div>
    );
  }
  if (pago === "pendiente") {
    return (
      <div className="mb-6 rounded-xl border border-amber-500/35 bg-amber-500/15 px-4 py-3 text-sm text-amber-50" role="status">
        <strong className="font-semibold text-white">Pago en proceso.</strong> Volvé más tarde; te avisamos cuando quede
        acreditado.
      </div>
    );
  }
  if (pago === "fallido") {
    return (
      <div className="mb-6 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="status">
        <strong className="font-semibold text-white">Pago no completado.</strong> Puedes intentarlo nuevamente cuando quieras
        con el botón de activar suscripción en el aviso de trial (si aplica).
      </div>
    );
  }
  return null;
}

export default async function PanelFinanzasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const pagoRaw = sp.pago;
  const pago = typeof pagoRaw === "string" ? pagoRaw : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: evento } = await selectEventoForMember(supabase, user!.id, "id");

  const { data: invRows } = await fetchInvitadosPanelRows(
    supabase,
    user!.id,
    evento?.id ?? null,
    "id, nombre_pasajero",
    { orderBy: "nombre_pasajero", ascending: true }
  );

  const invitados = (invRows ?? []) as unknown as Pick<Invitado, "id" | "nombre_pasajero">[];

  let initialAportes: AporteRegalo[] = [];
  let tableMissing = false;

  if (evento) {
    const { data: apData, error: apError } = await supabase
      .from("aportes_regalo")
      .select("*")
      .eq("evento_id", evento.id)
      .order("created_at", { ascending: false });

    if (apError) {
      const msg = apError.message?.toLowerCase() ?? "";
      if (msg.includes("does not exist") || apError.code === "42P01") {
        tableMissing = true;
      }
    } else {
      initialAportes = (apData as AporteRegalo[]) ?? [];
    }
  }

  return (
    <PanelPageContainer>
      {pagoBanner(pago)}

      <PanelPageHeader
        eyebrow="Finanzas"
        title="Regalos y pagos"
        subtitle="Datos para transferencias, registro de aportes y, si aplica, el estado de tu suscripción. Todo en un solo lugar."
      />

      <PanelSubpageProgress />

      <div className="mt-6 space-y-8 md:mt-8 md:space-y-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-lg font-bold text-white">Datos para transferencia</h2>
          <p className="mt-2 text-sm text-slate-400">
            Comparte estos datos con quien quiera hacerte un regalo en dinero (misma referencia que en la invitación, si
            la configuraste).
          </p>
          <dl className="mt-6 grid gap-3 rounded-xl bg-black/40 p-4 font-mono text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="text-slate-500">Banco</dt>
              <dd className="text-right text-white">Dreams Bank</dd>
            </div>
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="text-slate-500">IBAN</dt>
              <dd className="text-right text-teal-300">ES12 1234 5678 9012 3456 7890</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Titular</dt>
              <dd className="text-right text-white">Novios Dreams</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Concepto sugerido</dt>
              <dd className="text-right text-orange-300">Regalo + nombre</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            En una versión futura podrás conectar cobros automáticos; hoy el registro de regalos es manual.
          </p>
        </div>

        {evento ? (
          <AportesManager
            eventoId={evento.id}
            invitados={invitados}
            initialAportes={initialAportes}
            tableMissing={tableMissing}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-sm text-slate-400">
            <p className="font-medium text-slate-200">Crea primero la ficha del evento</p>
            <p className="mt-2">
              Para llevar un registro de aportes por invitado, necesitamos un evento vinculado a tu cuenta. Los datos
              bancarios de arriba los puedes compartir igualmente mientras tanto.
            </p>
            <Link
              href="/panel/evento"
              className="mt-4 inline-block text-sm font-medium text-teal-300 hover:text-teal-200"
            >
              Ir a datos del evento →
            </Link>
          </div>
        )}
      </div>
    </PanelPageContainer>
  );
}
