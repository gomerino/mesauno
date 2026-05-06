"use client";

import { createClient } from "@/lib/supabase/client";
import { eventoFotoPublicUrl } from "@/lib/evento-foto-url";
import type { EventoFoto } from "@/types/database";
import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo } from "react";

const ROTATIONS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-1", "rotate-1"];

type Props = {
  eventoId: string;
  fotos: EventoFoto[];
  setFotos: Dispatch<SetStateAction<EventoFoto[]>>;
  /** Menos aire y título más discreto (p. ej. dentro de pestañas). */
  compact?: boolean;
};

export function SoftAviationPolaroidStrip({ eventoId, fotos, setFotos, compact }: Props) {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`evento_fotos_polaroid:${eventoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "evento_fotos",
          filter: `evento_id=eq.${eventoId}`,
        },
        (payload) => {
          const row = payload.new as EventoFoto;
          if (!row?.id) return;
          setFotos((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [row, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventoId, setFotos, supabase]);

  if (fotos.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-invite-navy/12 bg-invite-sand/50 text-center text-invite-navy ${
          compact ? "px-3 py-6" : "px-4 py-10"
        }`}
      >
        <p className={`font-inviteSerif ${compact ? "text-base" : "text-lg"}`}>Nuestra bitácora</p>
        <p className="mt-2 text-sm text-invite-navy/60">
          Cuando empiecen a llegar las fotos, verás un carrusel tipo polaroid aquí.
        </p>
      </div>
    );
  }

  const slice = fotos.slice(0, 14);

  return (
    <div className={compact ? "" : "-mx-1"}>
      {!compact ? (
        <p className="mb-3 text-center font-inviteSerif text-lg text-invite-navy">Nuestra bitácora</p>
      ) : null}
      <div className={`flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:thin] ${compact ? "pb-1 pt-0" : "pb-4 pt-2"}`}>
        {slice.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => window.open(eventoFotoPublicUrl(f.storage_path), "_blank", "noopener,noreferrer")}
            className={`w-[min(68vw,200px)] shrink-0 snap-center rounded-lg border border-invite-navy/8 bg-white p-2 pb-7 text-left shadow-sm transition hover:border-invite-navy/18 ${ROTATIONS[i % ROTATIONS.length]}`}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded bg-invite-navy/5">
              <Image
                src={eventoFotoPublicUrl(f.storage_path)}
                alt=""
                fill
                className="object-cover"
                sizes="220px"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
