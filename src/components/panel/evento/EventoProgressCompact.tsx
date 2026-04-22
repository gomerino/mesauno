import { InvitacionesMetricStrip } from "@/components/panel/evento/InvitacionesMetricStrip";

type Props = {
  doneCount: number;
  total: number;
  totalInvitados: number;
  emailsEnviados: number;
  abrieronTrasCorreo: number;
};

function ProgressRow({ label, progress, ariaLabel }: { label: string; progress: number; ariaLabel: string }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div>
      <p className="text-xs text-white/60">{label}</p>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={ariaLabel}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-[#F5C451]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function EventoProgressCompact({
  doneCount,
  total,
  totalInvitados,
  emailsEnviados,
  abrieronTrasCorreo,
}: Props) {
  const viajePct = total > 0 ? Math.min(100, Math.round((doneCount / total) * 1000) / 10) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-black/30 p-3 md:grid-cols-2 md:gap-4">
      <ProgressRow
        label={`Viaje ${doneCount}/${total}`}
        progress={viajePct}
        ariaLabel={`Preparación del viaje: ${doneCount} de ${total}`}
      />
      <InvitacionesMetricStrip
        totalInvitados={totalInvitados}
        emailsEnviados={emailsEnviados}
        abrieronTrasCorreo={abrieronTrasCorreo}
      />
    </div>
  );
}
