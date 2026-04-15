"use client";

import { ExperienciaHeader } from "@/components/panel/experiencia/ExperienciaHeader";
import { ExperienceCard } from "@/components/panel/experiencia/ExperienceCard";
import Link from "next/link";

type Props = {
  isPaid: boolean;
};

export function ExperienciaPageClient({ isPaid }: Props) {
  const locked = !isPaid;

  return (
    <div className="animate-fadeIn pb-4">
      <ExperienciaHeader />

      <div
        className={`mb-8 rounded-2xl border px-4 py-3 transition-all duration-300 sm:px-5 sm:py-4 ${
          locked
            ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-50/95"
            : "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-50/95"
        }`}
        role="status"
      >
        {locked ? (
          <p className="text-center text-sm leading-relaxed sm:text-base">
            <span className="mr-1.5" aria-hidden>
              🔒
            </span>
            <span className="font-semibold">Experiencia bloqueada</span>
            <span className="mt-1 block text-xs font-normal text-amber-100/85 sm:mt-0 sm:inline sm:before:content-['\a0·\a0']">
              Activa tu viaje para habilitar todas estas funciones
            </span>
          </p>
        ) : (
          <p className="text-center text-sm font-medium sm:text-base">
            <span className="mr-1.5" aria-hidden>
              🟢
            </span>
            Experiencia activa
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:gap-8">
        <ExperienceCard
          title="Boarding ✈️"
          description="Mandá tus invitaciones y empezá el viaje con tus invitados"
          icon={<span aria-hidden>✈️</span>}
          status={locked ? "locked" : "active"}
        >
          <Link
            href="/panel/invitacion"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] px-5 text-sm font-semibold text-[#0f172a] shadow-lg transition hover:brightness-110 active:scale-[0.99]"
          >
            Mandar invitaciones ✈️
          </Link>
        </ExperienceCard>

        <ExperienceCard
          title="Ambiente del viaje 🎵"
          description="Tus invitados pueden sumar canciones a la playlist"
          icon={<span aria-hidden>🎵</span>}
          status={locked ? "locked" : "active"}
        />

        <ExperienceCard
          title="Recuerdos del viaje 📸"
          description="Fotos en tiempo real del evento"
          icon={<span aria-hidden>📸</span>}
          status={locked ? "locked" : "active"}
        />

        <ExperienceCard
          title="Regalos 🎁"
          description="Facilita cómo tus invitados te regalan"
          icon={<span aria-hidden>🎁</span>}
          status={locked ? "locked" : "active"}
        />
      </div>
    </div>
  );
}
