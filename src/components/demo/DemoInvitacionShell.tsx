"use client";

import { PaywallModal } from "@/components/PaywallModal";
import { Checklist, type ChecklistItem } from "@/components/onboarding/Checklist";
import { SoftAviationTicket } from "@/components/themes/soft-aviation/SoftAviationTicket";
import {
  ONBOARDING_DEMO_STORAGE_KEY,
  buildDemoInvitacion,
  defaultDemoPayload,
  type OnboardingDemoPayload,
} from "@/lib/demo-invitation-mock";
import { boardingPassQrMapUrlMerged } from "@/lib/evento-boarding";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  embed?: boolean;
};

function loadPayload(): OnboardingDemoPayload {
  if (typeof window === "undefined") return defaultDemoPayload();
  try {
    const raw = localStorage.getItem(ONBOARDING_DEMO_STORAGE_KEY);
    if (!raw) return defaultDemoPayload();
    const p = JSON.parse(raw) as OnboardingDemoPayload;
    if (p && typeof p.nombreNovios === "string" && typeof p.fechaEvento === "string") return p;
  } catch {
    /* ignore */
  }
  return defaultDemoPayload();
}

export function DemoInvitacionShell({ embed = false }: Props) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => [
    { id: "1", label: "Personaliza tu invitación", done: false },
    { id: "2", label: "Agrega invitados", done: false },
    { id: "3", label: "Comparte tu link", done: false },
  ]);

  const [payload, setPayload] = useState<OnboardingDemoPayload>(defaultDemoPayload);

  useEffect(() => {
    setPayload(loadPayload());
  }, []);

  const demo = useMemo(() => buildDemoInvitacion(payload), [payload]);
  const mapUrl = useMemo(() => boardingPassQrMapUrlMerged(demo.invitado, demo.evento), [demo]);

  const toggleChecklist = useCallback((id: string) => {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }, []);

  const openPaywall = useCallback(() => setPaywallOpen(true), []);

  const share = useCallback(() => {
    openPaywall();
  }, [openPaywall]);

  const copyLink = useCallback(async () => {
    openPaywall();
  }, [openPaywall]);

  if (embed) {
    return (
      <div className="min-h-0 bg-[#F4F1EA] px-2 py-4 font-inviteBody">
        <SoftAviationTicket
          invitado={demo.invitado}
          evento={demo.evento}
          merged={demo.merged}
          mapUrl={mapUrl}
          programaHitos={[]}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#020617] font-sans text-white">
      <header className="border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Link href="/" className="text-xs font-medium text-slate-400 hover:text-white">
            ← Inicio
          </Link>
          <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
            Vista previa
          </span>
          <Link href="/onboarding" className="text-xs font-medium text-[#D4AF37] hover:underline">
            Editar datos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 pb-28">
        <p className="text-center text-sm text-slate-400">Así verán tu invitación tus invitados</p>
        <div className="mt-6 rounded-xl border border-white/10 bg-[#F4F1EA]/95 p-3 shadow-xl">
          <SoftAviationTicket
            invitado={demo.invitado}
            evento={demo.evento}
            merged={demo.merged}
            mapUrl={mapUrl}
            programaHitos={[]}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={share}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
          >
            Compartir invitación
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Copiar link
          </button>
        </div>

        <section className="mt-12">
          <h2 className="text-center font-display text-lg font-semibold text-white">Siguiente paso</h2>
          <p className="mt-1 text-center text-xs text-slate-500">Activa tu evento para desbloquear todo el flujo</p>
          <div className="mt-5">
            <Checklist items={checklist} onToggle={toggleChecklist} />
          </div>
        </section>
      </main>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
