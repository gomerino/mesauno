"use client";

import { Check, Lock } from "lucide-react";

export type JourneyProgressProps = {
  eventoListo: boolean;
  invitadosListos: boolean;
  experienciaDesbloqueada: boolean;
  invitacionesEnviadas: boolean;
};

type StepState = "done" | "current" | "locked" | "pending";

function ringFor(state: StepState): string {
  switch (state) {
    case "done":
      return "border-emerald-300/70 bg-emerald-500/20 shadow-[0_0_24px_rgba(52,211,153,0.28)]";
    case "current":
      return "border-[#D4AF37]/70 bg-[#D4AF37]/18 shadow-[0_0_26px_rgba(212,175,55,0.3)]";
    case "locked":
      return "border-slate-500/45 bg-slate-700/20";
    default:
      return "border-white/10 bg-white/[0.02]";
  }
}

export function JourneyProgress({
  eventoListo,
  invitadosListos,
  experienciaDesbloqueada,
  invitacionesEnviadas,
}: JourneyProgressProps) {
  const s1: StepState = eventoListo ? "done" : "current";
  const s2: StepState = !eventoListo ? "pending" : invitadosListos ? "done" : "current";
  const s3: StepState = !experienciaDesbloqueada
    ? "locked"
    : invitacionesEnviadas
      ? "done"
      : "current";
  const s4: StepState = !experienciaDesbloqueada ? "locked" : "done";

  const steps: { key: string; title: string; state: StepState; sub: string }[] = [
    { key: "e", title: "Evento creado", state: s1, sub: "" },
    { key: "i", title: "Pasajeros", state: s2, sub: invitadosListos ? "" : "Por cargar" },
    {
      key: "inv",
      title: "Invitaciones",
      state: s3,
      sub: s3 === "locked" ? "Bloqueado" : invitacionesEnviadas ? "" : "Por enviar",
    },
    { key: "x", title: "Experiencia", state: s4, sub: s4 === "locked" ? "Bloqueado" : "Activa" },
  ];

  return (
    <section
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5"
      aria-label="Progreso del viaje"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ruta del viaje</p>

      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        {steps.map(({ key, title, state, sub }) => (
          <div key={key} className="flex flex-1 flex-col items-center text-center transition-all duration-300">
            <div
              className={`relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${ringFor(state)}`}
            >
              {state === "done" ? (
                <Check className="h-4 w-4 text-emerald-100" strokeWidth={3} />
              ) : state === "locked" ? (
                <Lock className="h-3.5 w-3.5 text-slate-300" strokeWidth={2.1} />
              ) : state === "current" ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37]/70 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-600" />
              )}
            </div>
            <p className="mt-3 text-[11px] font-semibold leading-tight text-slate-200 sm:text-xs">{title}</p>
            {sub ? <p className="mt-1 text-[10px] text-slate-500">{sub}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
