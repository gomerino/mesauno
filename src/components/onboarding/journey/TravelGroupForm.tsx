"use client";

import { createClient } from "@/lib/supabase/client";
import {
  defaultJourneyState,
  loadJourneyFromStorage,
  saveJourneyToStorage,
  type OnboardingJourneyState,
  type OnboardingTravelGroup,
} from "@/lib/onboarding-journey";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type CompanionRow = { key: string; name: string };

function newKey() {
  return `c-${crypto.randomUUID?.() ?? String(Date.now())}`;
}

export function TravelGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  const [journey, setJourney] = useState<OnboardingJourneyState | null>(null);
  const [primaryName, setPrimaryName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState<CompanionRow[]>([]);
  const [companionInput, setCompanionInput] = useState("");
  const [invitadoId, setInvitadoId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const s = loadJourneyFromStorage();
    if (s && s.eventId === eventId) {
      setJourney(s);
      const tg = s.travelGroup;
      if (tg) {
        setPrimaryName(tg.primaryName);
        setEmail(tg.primaryEmail ?? "");
        setPhone(tg.primaryPhone ?? "");
        setInvitadoId(tg.invitadoId ?? null);
        setCompanions(
          tg.companions.map((name) => ({
            key: newKey(),
            name,
          }))
        );
      }
      return;
    }
    if (eventId) {
      setJourney(
        defaultJourneyState({
          eventId,
          persisted: false,
          email: "",
          partner1_name: "",
          partner2_name: "",
          event_date: "",
          guests: [],
        })
      );
    }
  }, [eventId]);

  const writeTravelGroup = useCallback((tg: OnboardingTravelGroup) => {
    setInvitadoId((prevId) => (tg.invitadoId !== undefined ? tg.invitadoId ?? null : prevId));
    setJourney((prev) => {
      if (!prev) return prev;
      const merged: OnboardingTravelGroup = {
        ...tg,
        invitadoId: tg.invitadoId !== undefined ? tg.invitadoId : prev.travelGroup?.invitadoId,
      };
      const next: OnboardingJourneyState = { ...prev, travelGroup: merged };
      saveJourneyToStorage(next);
      return next;
    });
  }, []);

  const addCompanionLine = useCallback((raw: string) => {
    const t = raw.trim();
    if (!t) return;
    setCompanions((prev) => [...prev, { key: newKey(), name: t }]);
    setCompanionInput("");
  }, []);

  const onCompanionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompanionLine(companionInput);
    }
  };

  const removeCompanion = (key: string) => {
    setCompanions((prev) => prev.filter((c) => c.key !== key));
  };

  const updateCompanionName = (key: string, name: string) => {
    setCompanions((prev) => prev.map((c) => (c.key === key ? { ...c, name } : c)));
  };

  async function saveViaRpcOrApi(): Promise<boolean> {
    const name = primaryName.trim();
    if (!name || !eventId || !journey) return false;

    const names = companions.map((c) => c.name.trim()).filter(Boolean);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && !invitadoId) {
      const { data: newId, error: insErr } = await supabase.rpc("insert_invitado_panel", {
        p_evento_id: eventId,
        p_nombre_pasajero: name,
        p_email: email.trim() || null,
        p_telefono: phone.trim() || null,
        p_asiento: null,
        p_restricciones_alimenticias: null,
      });

      if (!insErr && newId && typeof newId === "string") {
        const { error: syncErr } = await supabase.rpc("sync_invitado_acompanantes_panel", {
          p_invitado_id: newId,
          p_nombres: names,
        });
        if (!syncErr) {
          writeTravelGroup({
            invitadoId: newId,
            primaryName: name,
            primaryEmail: email.trim() || undefined,
            primaryPhone: phone.trim() || undefined,
            companions: names,
          });
          return true;
        }
      }
    }

    if (user && invitadoId) {
      const { error: upErr } = await supabase
        .from("invitados")
        .update({
          nombre_pasajero: name,
          email: email.trim() || null,
          telefono: phone.trim() || null,
        })
        .eq("id", invitadoId);

      if (!upErr) {
        const { error: syncErr } = await supabase.rpc("sync_invitado_acompanantes_panel", {
          p_invitado_id: invitadoId,
          p_nombres: names,
        });
        if (!syncErr) {
          writeTravelGroup({
            invitadoId,
            primaryName: name,
            primaryEmail: email.trim() || undefined,
            primaryPhone: phone.trim() || undefined,
            companions: names,
          });
          return true;
        }
      }
    }

    if (journey.persisted) {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          companions: names,
          invitado_id: invitadoId ?? undefined,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (res.ok && j.id) {
        writeTravelGroup({
          invitadoId: j.id,
          primaryName: name,
          primaryEmail: email.trim() || undefined,
          primaryPhone: phone.trim() || undefined,
          companions: names,
        });
        return true;
      }
    }

    writeTravelGroup({
      invitadoId: invitadoId ?? undefined,
      primaryName: name,
      primaryEmail: email.trim() || undefined,
      primaryPhone: phone.trim() || undefined,
      companions: names,
    });
    return false;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!primaryName.trim()) {
      setErr("El nombre del pasajero principal es obligatorio.");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const ok = await saveViaRpcOrApi();
      setMsg(
        ok
          ? "Grupo guardado en tu evento."
          : "Guardado en este dispositivo para la vista previa. Cuando tengas acceso al panel del evento, podrás sincronizar todo."
      );
    } finally {
      setBusy(false);
    }
  }

  function addDemoGroup() {
    setPrimaryName("María González");
    setEmail("maria@ejemplo.cl");
    setPhone("");
    setCompanions([
      { key: newKey(), name: "Pedro Soto" },
      { key: newKey(), name: "Ana Martínez" },
    ]);
    setMsg(null);
    setErr(null);
  }

  if (!eventId || !journey) {
    return (
      <p className="text-center text-sm text-slate-400">
        <Link href="/onboarding" className="text-[#D4AF37] hover:underline">
          Empezar de nuevo
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold text-white">Grupo de viaje</h2>
        <p className="mt-1 text-sm text-slate-500">
          Un pasajero principal y quienes vuelan con él. Podés ajustar todo antes de enviar invitaciones.
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        <div className="rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/[0.07] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">Pasajero principal</p>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="tg-name" className="block text-xs font-medium text-slate-400">
                Nombre completo <span className="text-rose-400">*</span>
              </label>
              <input
                id="tg-name"
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Como en el pase"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-3 py-3 text-sm text-white placeholder:text-slate-600"
              />
            </div>
            <div>
              <label htmlFor="tg-email" className="block text-xs font-medium text-slate-400">
                Email (opcional)
              </label>
              <input
                id="tg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-3 py-3 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="tg-phone" className="block text-xs font-medium text-slate-400">
                Teléfono (opcional)
              </label>
              <input
                id="tg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0f172a]/90 px-3 py-3 text-sm text-white"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Acompañantes</p>
          <p className="mt-1 text-xs text-slate-500">Escribí un nombre y pulsá Enter o “Añadir”.</p>
          <div className="mt-3 flex gap-2">
            <input
              value={companionInput}
              onChange={(e) => setCompanionInput(e.target.value)}
              onKeyDown={onCompanionKeyDown}
              placeholder="Nombre del acompañante"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#0f172a]/80 px-3 py-3 text-sm text-white placeholder:text-slate-600"
              aria-label="Nombre del acompañante"
            />
            <button
              type="button"
              onClick={() => addCompanionLine(companionInput)}
              className="shrink-0 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-3 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/25"
            >
              Añadir
            </button>
          </div>

          {companions.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {companions.map((c) => (
                <li
                  key={c.key}
                  className="flex items-center gap-2 pl-3 sm:pl-5"
                >
                  <span className="text-slate-600" aria-hidden>
                    └
                  </span>
                  <input
                    value={c.name}
                    onChange={(e) => updateCompanionName(c.key, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200"
                    aria-label="Editar acompañante"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompanion(c.key)}
                    className="shrink-0 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-white/10 hover:text-rose-300"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-600">Todavía no hay acompañantes en el grupo.</p>
          )}
        </div>

        {err ? <p className="text-sm text-rose-300">{err}</p> : null}
        {msg ? <p className="text-sm text-emerald-300/90">{msg}</p> : null}

        <button
          type="submit"
          disabled={busy || !primaryName.trim()}
          className="w-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] py-3.5 text-sm font-semibold text-[#0f172a] shadow-lg disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar grupo de viaje"}
        </button>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={addDemoGroup}
          className="flex-1 rounded-full border border-white/15 py-3 text-sm font-medium text-white hover:bg-white/5"
        >
          Cargar grupo demo
        </button>
        <button
          type="button"
          onClick={() => router.push(`/onboarding/full?eventId=${encodeURIComponent(eventId)}`)}
          className="flex-1 rounded-full border border-white/15 py-3 text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          Agregar después
        </button>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/onboarding/full?eventId=${encodeURIComponent(eventId)}`)}
        className="w-full rounded-full bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/15"
      >
        Ver invitación completa
      </button>
    </div>
  );
}
