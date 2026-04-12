"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function parseTargetMs(fechaIso: string | null, hora: string): number | null {
  if (!fechaIso) return null;
  const day = fechaIso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [y, mo, d] = day.split("-").map(Number);
  const parts = (hora || "16:00").split(":");
  const hh = Number(parts[0] ?? 16);
  const mm = Number(parts[1] ?? 0);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d, hh, mm, 0, 0).getTime();
}

type Props = {
  fechaEvento: string | null;
  horaEmbarque: string;
  /** `headerMono`: una línea, mono, sobre fondo oscuro. `blocks`: tarjetas (tema claro). */
  variant?: "blocks" | "inlineLight" | "headerMono";
  /** Menos margen y tamaño (hero compacto / pestaña pase). */
  dense?: boolean;
};

export function SoftAviationCountdown({ fechaEvento, horaEmbarque, variant = "blocks", dense = false }: Props) {
  const target = useMemo(() => parseTargetMs(fechaEvento, horaEmbarque), [fechaEvento, horaEmbarque]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (target == null || Number.isNaN(target)) {
    if (variant === "headerMono") {
      return (
        <p
          className={`max-w-full font-mono text-[#1A2B48]/65 ${dense ? "mt-0.5 text-[9px] sm:text-[10px]" : "mt-1.5 text-[10px] sm:text-[11px]"}`}
        >
          Fecha de aterrizaje por confirmar
        </p>
      );
    }
    return (
      <div className="mt-2 rounded-xl border border-[#1A2B48]/10 bg-white px-3 py-2 text-center text-xs text-[#1A2B48]/70">
        Pronto la fecha exacta del aterrizaje.
      </div>
    );
  }

  const diff = Math.max(0, target - now);
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (variant === "headerMono") {
    return (
      <p
        className={`max-w-full whitespace-normal break-words font-mono tabular-nums tracking-tight text-[#1A2B48] ${dense ? "mt-0.5 text-[9px] sm:text-[10px]" : "mt-1.5 text-[10px] sm:text-[11px]"}`}
        aria-live="polite"
      >
        <span className="text-[#1A2B48]/60">Faltan</span>{" "}
        <span className="font-semibold">{pad2(d)}</span>
        <span className="text-[#1A2B48]/45">d</span>
        <span className="text-[#1A2B48]/40"> : </span>
        <span className="font-semibold">{pad2(h)}</span>
        <span className="text-[#1A2B48]/45">h</span>
        <span className="text-[#1A2B48]/40"> : </span>
        <span className="font-semibold">{pad2(m)}</span>
        <span className="text-[#1A2B48]/45">m</span>
        <span className="text-[#1A2B48]/40"> : </span>
        <span className="font-semibold">{pad2(s)}</span>
        <span className="text-[#1A2B48]/45">s</span>
      </p>
    );
  }

  if (variant === "inlineLight") {
    const parts = [
      { label: "D", v: pad2(d) },
      { label: "H", v: pad2(h) },
      { label: "M", v: pad2(m) },
      { label: "S", v: pad2(s) },
    ];
    return (
      <div className="mt-3 border-t border-[#1A2B48]/10 pt-3">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1A2B48]/45">Embarque en</p>
          <div className="flex items-baseline gap-1 tabular-nums text-[#1A2B48]" aria-live="polite">
            {parts.map((c, i) => (
              <span key={c.label} className="flex items-baseline gap-1">
                {i > 0 ? <span className="text-[#1A2B48]/25">:</span> : null}
                <span className="text-lg font-semibold tracking-tight sm:text-xl">{c.v}</span>
                <span className="text-[10px] font-medium text-[#1A2B48]/50">{c.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cells = [
    { label: "Días", v: pad2(d) },
    { label: "Horas", v: pad2(h) },
    { label: "Min", v: pad2(m) },
    { label: "Seg", v: pad2(s) },
  ];

  return (
    <div className="mt-6">
      <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[#1A2B48]/50">
        Embarque en
      </p>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:gap-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[#1A2B48]/10 bg-[#1A2B48] px-1 py-3 text-center shadow-sm sm:py-4"
          >
            <p className="text-xl font-semibold tabular-nums tracking-tight text-white sm:text-2xl">{c.v}</p>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-[#D4AF37]/95">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
