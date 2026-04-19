"use client";

import { INVITACION_THEMES, type InvitacionThemeId } from "@/lib/invitacion-theme";

type Props = {
  value: InvitacionThemeId;
  onChange: (next: InvitacionThemeId) => void;
  disabled?: boolean;
};

const NAVY = "#001d66";
const GOLD = "#b89442";

/**
 * Mini boarding pass estilo Legacy (BoardingPassCard real).
 * - Cabecera navy con códigos de aeropuerto.
 * - Grid con "Embarque" destacado en navy.
 * - QR sugerido abajo.
 */
function LegacyBoardingMock() {
  return (
    <div
      className="mx-auto w-full max-w-[180px] overflow-hidden rounded-[3px] border border-gray-300 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
      aria-hidden
    >
      {/* Header navy con códigos */}
      <div
        className="flex items-center justify-between px-2 py-1.5 text-white"
        style={{ backgroundColor: NAVY }}
      >
        <div className="flex flex-col leading-none">
          <span className="text-[7px] font-semibold uppercase tracking-[0.2em] opacity-75">
            From
          </span>
          <span className="font-display text-[14px] font-bold leading-none">SCL</span>
        </div>
        <div className="flex flex-col items-center text-[9px] leading-none opacity-90">
          <span aria-hidden>✈</span>
          <span className="mt-0.5 text-[6px] uppercase tracking-widest">Boarding</span>
        </div>
        <div className="flex flex-col items-end leading-none">
          <span className="text-[7px] font-semibold uppercase tracking-[0.2em] opacity-75">
            To
          </span>
          <span className="font-display text-[14px] font-bold leading-none">DAY</span>
        </div>
      </div>

      {/* Perforación */}
      <div className="border-t border-dashed border-gray-300 bg-gray-50" style={{ height: 3 }} />

      <div className="px-2 py-2">
        <p className="text-center text-[7px] font-medium text-gray-700">
          <span aria-hidden>📍</span> Centro de eventos
        </p>

        <div className="mt-1.5 border-t border-dashed border-gray-200 pt-1.5">
          <p className="text-[6px] font-semibold uppercase tracking-widest text-gray-500">
            Passenger
          </p>
          <p className="mt-0.5 font-display text-[10px] font-bold uppercase leading-tight tracking-wide text-gray-900">
            Ana &amp; Lucas
          </p>
        </div>

        {/* Grid: vuelo / embarque / fecha / asiento */}
        <div className="mt-2 grid grid-cols-4 border-t border-gray-200 pt-1 text-center">
          <div className="border-r border-dotted border-gray-300 py-0.5">
            <p className="text-[5px] font-semibold uppercase tracking-wide text-gray-500">Vuelo</p>
            <p className="font-mono text-[7px] font-bold text-gray-900">DM77</p>
          </div>
          <div className="border-r border-dotted border-gray-300 py-0.5">
            <p className="text-[5px] font-semibold uppercase tracking-wide text-gray-500">Emb.</p>
            <p
              className="mx-0.5 font-mono text-[7px] font-bold text-white"
              style={{ backgroundColor: NAVY }}
            >
              17:30
            </p>
          </div>
          <div className="border-r border-dotted border-gray-300 py-0.5">
            <p className="text-[5px] font-semibold uppercase tracking-wide text-gray-500">Fecha</p>
            <p className="font-mono text-[7px] font-bold text-gray-900">23 NOV</p>
          </div>
          <div className="py-0.5">
            <p className="text-[5px] font-semibold uppercase tracking-wide text-gray-500">Asiento</p>
            <p className="font-mono text-[7px] font-bold text-gray-900">12A</p>
          </div>
        </div>

        {/* QR */}
        <div className="mt-1.5 flex justify-center border-t border-dashed border-gray-200 pt-1.5">
          <div className="grid h-8 w-8 grid-cols-6 grid-rows-6 gap-[1px] rounded-[2px] bg-white p-[2px] ring-1 ring-gray-200">
            {/* Simulación simple de QR */}
            {Array.from({ length: 36 }).map((_, i) => {
              const filled = [
                0, 1, 2, 4, 6, 7, 11, 12, 14, 16, 19, 20, 22, 25, 27, 28, 29, 30, 32, 33, 35,
              ].includes(i);
              return (
                <span
                  key={i}
                  className={filled ? "bg-gray-900" : "bg-transparent"}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/80 px-2 py-1 text-center">
        <p className="text-[6px] font-medium text-gray-700">Operado por Dreams Airlines</p>
      </div>
    </div>
  );
}

/**
 * Mini boarding pass estilo Soft Aviation (SoftAviationTicket real).
 * - Cabecera con "Dreams Airlines · Together, forever" y códigos.
 * - Zona de pasajero con dress code destacado en dorado.
 * - Grid con "Hora" destacado en dorado.
 * - Cierre con "Todo listo, te esperamos a bordo".
 */
function SoftAviationBoardingMock() {
  return (
    <div
      className="mx-auto w-full max-w-[180px] overflow-hidden rounded-[2px] border border-[rgba(0,29,102,0.22)] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
      aria-hidden
    >
      {/* Cabecera branded */}
      <div className="px-2 py-1.5" style={{ color: NAVY }}>
        <p
          className="text-center text-[7px] font-semibold uppercase leading-none tracking-[0.28em]"
          style={{ color: GOLD }}
        >
          Dreams Airlines
        </p>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-display text-[13px] font-bold leading-none">SCL</span>
          <span className="text-[9px] leading-none opacity-70" aria-hidden>
            ✈
          </span>
          <span className="font-display text-[13px] font-bold leading-none">DAY</span>
        </div>
        <p className="mt-1 text-center text-[6px] font-medium italic tracking-wide opacity-60">
          Together, forever
        </p>
      </div>

      {/* Pasajero */}
      <div className="border-t border-dashed px-2 pb-2 pt-1.5" style={{ borderColor: "rgba(0,29,102,0.22)" }}>
        <p
          className="text-[5px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "rgba(0,29,102,0.5)" }}
        >
          Pasajero / Passenger name
        </p>
        <p
          className="mt-1 font-sans text-[10px] font-bold uppercase leading-tight tracking-[0.06em]"
          style={{ color: NAVY }}
        >
          ANA &amp; LUCAS
        </p>
        <p className="mt-1 text-center text-[6px] font-medium">
          <span style={{ color: "rgba(0,29,102,0.55)" }}>Dress code:</span>{" "}
          <span className="font-semibold" style={{ color: GOLD }}>
            Elegante
          </span>
        </p>
      </div>

      {/* Grid: código / hora / fecha / destino / grupo */}
      <div
        className="grid grid-cols-5 border-t border-dashed py-1 text-center"
        style={{ borderColor: "rgba(0,29,102,0.22)" }}
      >
        <div className="border-r border-dotted px-0.5" style={{ borderColor: "rgba(0,29,102,0.2)" }}>
          <p className="text-[5px] font-semibold uppercase" style={{ color: "rgba(0,29,102,0.5)" }}>
            Cód
          </p>
          <p className="font-mono text-[6px]" style={{ color: "rgba(0,29,102,0.45)" }}>
            DM77
          </p>
        </div>
        <div className="border-r border-dotted px-0.5" style={{ borderColor: "rgba(0,29,102,0.2)" }}>
          <p className="text-[5px] font-semibold uppercase" style={{ color: "rgba(0,29,102,0.5)" }}>
            Hora
          </p>
          <p
            className="font-mono text-[7px] font-bold"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            17:30
          </p>
        </div>
        <div className="border-r border-dotted px-0.5" style={{ borderColor: "rgba(0,29,102,0.2)" }}>
          <p className="text-[5px] font-semibold uppercase" style={{ color: "rgba(0,29,102,0.5)" }}>
            Fecha
          </p>
          <p className="font-mono text-[6px] font-bold" style={{ color: NAVY }}>
            23 NOV
          </p>
        </div>
        <div className="border-r border-dotted px-0.5" style={{ borderColor: "rgba(0,29,102,0.2)" }}>
          <p className="text-[5px] font-semibold uppercase" style={{ color: "rgba(0,29,102,0.5)" }}>
            Destino
          </p>
          <p className="text-[6px] font-semibold" style={{ color: NAVY }}>
            Mesa 4
          </p>
        </div>
        <div className="px-0.5">
          <p className="text-[5px] font-semibold uppercase" style={{ color: "rgba(0,29,102,0.5)" }}>
            Grupo
          </p>
          <p className="text-[6px] font-semibold" style={{ color: "rgba(0,29,102,0.75)" }}>
            Novios
          </p>
        </div>
      </div>

      {/* Itinerario */}
      <div
        className="border-t border-dashed px-2 py-1.5 text-center"
        style={{ borderColor: "rgba(0,29,102,0.22)" }}
      >
        <p
          className="text-[5px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: "rgba(0,29,102,0.45)" }}
        >
          Itinerario
        </p>
        <p
          className="mt-0.5 text-[7px] font-semibold leading-snug"
          style={{ color: NAVY }}
        >
          <span aria-hidden>📍</span> Centro de eventos
        </p>
      </div>

      <div
        className="border-t border-dashed px-2 py-1 text-center"
        style={{ borderColor: "rgba(0,29,102,0.22)" }}
      >
        <p className="text-[6px] font-medium" style={{ color: "rgba(0,29,102,0.7)" }}>
          Todo listo, te esperamos a bordo
        </p>
      </div>
    </div>
  );
}

const MOCKS: Record<InvitacionThemeId, React.ReactNode> = {
  legacy: <LegacyBoardingMock />,
  "soft-aviation": <SoftAviationBoardingMock />,
};

export function InvitationThemePicker({ value, onChange, disabled }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Estilo de invitación"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {INVITACION_THEMES.map((t) => {
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            className={[
              "group relative flex flex-col gap-3 rounded-xl border p-3 text-left transition",
              selected
                ? "border-sky-400/60 bg-sky-500/10 shadow-sm ring-1 ring-sky-400/40"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-black/70 px-2 py-3">
              {MOCKS[t.id]}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{t.tagline}</p>
              </div>
              <span
                aria-hidden
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  selected
                    ? "border-sky-300 bg-sky-400 text-[#0b1220]"
                    : "border-white/20 bg-transparent text-transparent",
                ].join(" ")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
