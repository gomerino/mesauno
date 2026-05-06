import type { AviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";

/**
 * Sustituye clases `invite.*` en el pase Soft / Jurnex aviation (misma estructura, otra cromía).
 */
export type InviteAviationTicketUi = {
  sectionText: string;
  dashCellBorder: string;
  labelMuted: string;
  valueMain: string;
  cardBorder: string;
  lineUpper: string;
  passenger: string;
  passengerSecondary: string;
  dress: string;
  dressCodeLabel: string;
  dashDashed: string;
  codeMono: string;
  horaBlock: string;
  destinoSecondary: string;
  grupo: string;
  itinTitle: string;
  itinAddress: string;
  itinHint: string;
  itinCierre: string;
  mapIcon: string;
  inlineMapBtn: string;
};

const soft: InviteAviationTicketUi = {
  sectionText: "text-invite-navy",
  dashCellBorder: "border-invite-navy/25",
  labelMuted: "text-invite-navy/50",
  valueMain: "text-invite-navy",
  cardBorder: "border-invite-navy/20",
  lineUpper: "text-invite-navy/50",
  passenger: "text-invite-navy",
  passengerSecondary: "text-invite-navy/92",
  dress: "text-invite-navy/70",
  dressCodeLabel: "text-invite-navy/55",
  dashDashed: "border-invite-navy/22",
  codeMono: "text-invite-navy/40",
  horaBlock: "text-invite-navy",
  destinoSecondary: "text-invite-navy/65",
  grupo: "text-invite-navy/75",
  itinTitle: "text-invite-navy/45",
  itinAddress: "text-invite-navy",
  itinHint: "text-invite-navy/50",
  itinCierre: "text-invite-navy/70",
  mapIcon: "text-invite-navy/80",
  inlineMapBtn:
    "inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-invite-navy/28 bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-invite-navy shadow-none transition-all duration-200 ease-out hover:bg-invite-sand/50 hover:opacity-90 active:scale-[0.97] active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-navy/35",
};

const jurnex: InviteAviationTicketUi = {
  sectionText: "text-inviteJurnex-navy",
  dashCellBorder: "border-inviteJurnex-navy/25",
  labelMuted: "text-inviteJurnex-navy/50",
  valueMain: "text-inviteJurnex-navy",
  cardBorder: "border-inviteJurnex-navy/20",
  lineUpper: "text-inviteJurnex-navy/50",
  passenger: "text-inviteJurnex-navy",
  passengerSecondary: "text-inviteJurnex-navy/90",
  dress: "text-inviteJurnex-navy/70",
  dressCodeLabel: "text-inviteJurnex-navy/55",
  dashDashed: "border-inviteJurnex-navy/22",
  codeMono: "text-inviteJurnex-navy/40",
  horaBlock: "text-inviteJurnex-navy",
  destinoSecondary: "text-inviteJurnex-navy/65",
  grupo: "text-inviteJurnex-navy/75",
  itinTitle: "text-inviteJurnex-navy/45",
  itinAddress: "text-inviteJurnex-navy",
  itinHint: "text-inviteJurnex-navy/50",
  itinCierre: "text-inviteJurnex-navy/70",
  mapIcon: "text-inviteJurnex-navy/80",
  inlineMapBtn:
    "inline-flex min-h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-inviteJurnex-navy/28 bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-inviteJurnex-navy shadow-none transition-all duration-200 ease-out hover:bg-inviteJurnex-sand/50 hover:opacity-90 active:scale-[0.97] active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inviteJurnex-navy/35",
};

const m: Record<AviationInvitacionVariant, InviteAviationTicketUi> = { soft, jurnex };

export function getAviationInviteTicketUi(variant: AviationInvitacionVariant): InviteAviationTicketUi {
  return m[variant] ?? soft;
}

export function embarqueGoldCell(variant: AviationInvitacionVariant): string {
  return variant === "jurnex"
    ? "flex h-full w-full min-w-0 items-center justify-center bg-inviteJurnex-gold px-0.5 py-1 text-center font-mono text-[10px] font-bold leading-none text-inviteJurnex-navy sm:px-1 sm:text-[11px]"
    : "flex h-full w-full min-w-0 items-center justify-center bg-invite-gold px-0.5 py-1 text-center font-mono text-[10px] font-bold leading-none text-invite-navy sm:px-1 sm:text-[11px]";
}

export function dressGoldAccent(variant: AviationInvitacionVariant): string {
  return variant === "jurnex" ? "text-inviteJurnex-gold" : "text-invite-gold";
}
