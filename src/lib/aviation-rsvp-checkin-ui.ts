import { panelCtaJurnexGoldAction, panelCtaJurnexGoldSurface } from "@/components/panel/ds/panel-ds-classes";
import type { AviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";

/** Misma piel CTA oro que el panel (RSVP flujo claro / Jurnex). */
const rsvpCtaJurnexGold = ` ${panelCtaJurnexGoldSurface} ${panelCtaJurnexGoldAction}`;

/** Estilos del full-screen de RSV P (Soft Aviation / Jurnex). */
export type AviationRsvpCheckinUi = {
  page: string;
  header: string;
  h2: string;
  h2Done: string;
  stepPill: string;
  closeBtn: string;
  stepOn: string;
  stepOff: string;
  err: string;
  body: string;
  pLead: string;
  pMuted: string;
  radioOn: string;
  radioOff: string;
  radioInput: string;
  checkOn: string;
  checkOff: string;
  checkInput: string;
  checkLabel: string;
  textArea: string;
  textInput: string;
  fieldLabel: string;
  resumenBox: string;
  footer: string;
  backBtn: string;
  nextBtn: string;
  /** Misma acción principal, ancho completo (pantalla de éxito). */
  ctaSolo: string;
  /** Grupo éxito: pase con sello (premium). */
  successBlock: string;
  successKicker: string;
  successTicket: string;
  successTicketGlow: string;
  successSelloFrame: string;
  successSelloBar: string;
  successSelloCheckOuter: string;
  successSelloCheckInner: string;
  successStampWord: string;
  successH3: string;
  successBody: string;
  successHint: string;
};

const soft: AviationRsvpCheckinUi = {
  page:
    "fixed inset-0 z-aviation-rsvp-overlay-9600 isolate flex h-[100dvh] min-h-0 max-h-[100dvh] animate-fadeIn flex-col overflow-hidden overscroll-none bg-gradient-to-b from-invite-parchment to-invite-warm text-invite-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] [transform:translateZ(0)]",
  header: "shrink-0 border-b border-invite-navy/8 bg-invite-sand/92 px-4 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-sm supports-[backdrop-filter]:bg-invite-sand/85",
  h2: "font-inviteSerif text-[1.35rem] font-semibold leading-tight text-invite-navy tracking-tight",
  h2Done: "font-inviteSerif text-[1.2rem] font-semibold text-invite-navy tracking-tight",
  stepPill: "text-xs font-medium text-invite-navy/48",
  closeBtn:
    "rounded-full p-2.5 text-invite-navy/50 transition hover:bg-invite-navy/5 hover:text-invite-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-invite-gold/45",
  stepOn: "bg-gradient-to-r from-invite-gold-mid to-invite-gold shadow-sm",
  stepOff: "bg-invite-navy/8",
  err: "mb-4 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2.5 text-sm text-red-800",
  body: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]",
  pLead: "text-sm font-medium text-invite-navy",
  pMuted: "text-sm text-invite-navy/72",
  radioOn: "border-invite-gold bg-white text-invite-navy shadow-sm ring-1 ring-invite-gold/20",
  radioOff: "border-invite-navy/5 bg-white text-invite-navy/82 hover:border-invite-navy/14",
  radioInput: "h-4 w-4 accent-invite-gold",
  checkOn: "border-invite-gold bg-white shadow-sm ring-1 ring-invite-gold/20",
  checkOff: "border-invite-navy/5 bg-white hover:border-invite-navy/12",
  checkInput: "h-4 w-4 rounded accent-invite-gold",
  checkLabel: "text-sm font-medium text-invite-navy",
  textArea:
    "mt-1 w-full resize-none rounded-2xl border border-invite-navy/5 bg-white px-3 py-2.5 text-sm text-invite-navy shadow-[inset_0_1px_2px_rgba(26,43,72,0.04)] outline-none ring-invite-gold/30 focus:ring-2",
  textInput:
    "w-full rounded-full border border-invite-navy/5 bg-white px-4 py-3 text-sm text-invite-navy shadow-[inset_0_1px_2px_rgba(26,43,72,0.04)] outline-none ring-invite-gold/30 focus:ring-2",
  fieldLabel: "text-[11px] font-semibold uppercase tracking-[0.18em] text-invite-navy/42",
  resumenBox: "list-inside list-disc rounded-2xl border border-invite-navy/5 bg-white px-4 py-3 text-sm text-invite-navy shadow-sm",
  footer: "shrink-0 border-t border-invite-navy/8 bg-invite-sand/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(26,43,72,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-invite-sand/88",
  backBtn: "rounded-full border border-invite-navy/10 px-5 py-2.5 text-sm font-medium text-invite-navy transition hover:bg-invite-navy/5",
  nextBtn:
    "ml-auto inline-flex min-h-[2.6rem] items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold" + rsvpCtaJurnexGold,
  ctaSolo:
    "mt-1 inline-flex w-full max-w-sm items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold" + rsvpCtaJurnexGold,
  successBlock: "mx-auto w-full max-w-sm px-0 py-2 motion-safe:animate-rsvpReveal motion-reduce:opacity-100",
  successKicker:
    "mb-5 text-center text-[9px] font-semibold uppercase tracking-[0.28em] text-invite-navy/48",
  successTicket:
    "relative overflow-hidden rounded-2xl border-2 border-invite-gold/50 bg-gradient-to-b from-white via-white to-invite-cream p-1 shadow-[0_20px_48px_-20px_rgba(26,43,72,0.22),inset_0_1px_0_rgba(255,255,255,0.8)]",
  successTicketGlow: "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-invite-gold/20 blur-2xl",
  successSelloFrame:
    "relative z-10 mx-3 mt-2 flex min-h-[7.5rem] items-stretch overflow-hidden rounded-xl border-2 border-dashed border-invite-navy/10 bg-gradient-to-b from-white to-invite-sand/80",
  successSelloBar: "w-2 shrink-0 bg-gradient-to-b from-invite-gold to-invite-gold-shadow",
  successSelloCheckOuter: "mx-auto my-auto flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-full border-[2.5px] border-invite-gold bg-white shadow-sm animate-stampDrop motion-reduce:animate-none",
  successSelloCheckInner:
    "flex h-[3.15rem] w-[3.15rem] items-center justify-center rounded-full bg-invite-gold/12 text-3xl text-invite-navy animate-boardingValidated motion-reduce:animate-none",
  successStampWord: "pt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-invite-navy/50",
  successH3: "px-3 pb-0.5 pt-5 text-center font-inviteSerif text-[1.35rem] font-semibold leading-tight text-invite-navy",
  successBody: "px-3 pb-1 text-center text-sm leading-relaxed text-invite-navy/75",
  successHint:
    "mx-2 mb-1 mt-1 rounded-lg border-t border-dashed border-invite-navy/10 bg-invite-navy/[0.02] px-2 py-2.5 text-center text-[12px] leading-relaxed text-invite-navy/58",
};

const jurnex: AviationRsvpCheckinUi = {
  page: [
    "fixed inset-0 z-aviation-rsvp-overlay-9600 isolate flex h-[100dvh] min-h-0 max-h-[100dvh] flex-col overflow-hidden overscroll-none",
    "animate-fadeIn text-inviteJurnex-navy [color-scheme:light] [transform:translateZ(0)]",
    "bg-inviteJurnex-cream shadow-[0_0_0_1px_rgba(2,24,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)]",
  ].join(" "),
  header: [
    "shrink-0 border-b border-inviteJurnex-navy/[0.1] bg-white",
    "px-4 py-3.5 pt-[max(0.65rem,env(safe-area-inset-top))]",
    "shadow-[0_4px_20px_rgba(2,24,42,0.06)]",
  ].join(" "),
  h2: "font-display text-lg font-semibold leading-snug tracking-tight text-inviteJurnex-navy sm:text-[1.35rem]",
  h2Done: "font-display text-[1.2rem] font-semibold text-inviteJurnex-navy",
  stepPill: "text-[11px] font-semibold uppercase tracking-[0.2em] text-inviteJurnex-navy/50",
  closeBtn: [
    "shrink-0 rounded-full p-2.5 text-inviteJurnex-navy/50 transition",
    "ring-1 ring-transparent hover:bg-inviteJurnex-navy/[0.06] hover:text-inviteJurnex-navy",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inviteJurnex-gold/50",
  ].join(" "),
  stepOn: "bg-gradient-to-r from-inviteJurnex-gold to-amber-500/95 shadow-[0_0_0_1px_rgba(232,154,30,0.25)]",
  stepOff: "bg-inviteJurnex-navy/[0.1]",
  err: "mb-4 rounded-2xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm",
  body: "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-inviteJurnex-cream px-4 py-5 [-webkit-overflow-scrolling:touch] sm:px-5",
  pLead: "text-[15px] font-semibold leading-snug text-inviteJurnex-navy",
  pMuted: "text-sm leading-relaxed text-inviteJurnex-navy/80",
  radioOn: [
    "border-inviteJurnex-gold bg-white text-inviteJurnex-navy",
    "shadow-md shadow-inviteJurnex-navy/10 ring-1 ring-inviteJurnex-gold/50",
  ].join(" "),
  radioOff: [
    "border border-inviteJurnex-navy/10 bg-white text-inviteJurnex-navy/88",
    "hover:border-inviteJurnex-navy/20 hover:shadow-sm",
  ].join(" "),
  radioInput: "h-4 w-4 shrink-0 accent-[#0d9488]",
  checkOn: [
    "border-inviteJurnex-gold bg-white shadow-sm ring-1 ring-inviteJurnex-gold/40",
  ].join(" "),
  checkOff: "border border-inviteJurnex-navy/10 bg-white hover:border-inviteJurnex-navy/20",
  checkInput: "h-4 w-4 shrink-0 rounded accent-[#0d9488]",
  checkLabel: "text-sm font-medium text-inviteJurnex-navy",
  textArea: [
    "mt-1.5 w-full resize-none rounded-2xl border-2 border-inviteJurnex-navy/10 bg-white px-4 py-3.5",
    "text-sm text-inviteJurnex-navy shadow-sm outline-none",
    "transition focus:border-inviteJurnex-gold/60 focus:ring-2 focus:ring-inviteJurnex-gold/20",
  ].join(" "),
  textInput: [
    "w-full rounded-full border-2 border-inviteJurnex-navy/10 bg-white px-5 py-3.5",
    "text-sm text-inviteJurnex-navy shadow-sm outline-none",
    "transition focus:border-inviteJurnex-gold/60 focus:ring-2 focus:ring-inviteJurnex-gold/20",
  ].join(" "),
  fieldLabel: "text-[10px] font-bold uppercase tracking-[0.24em] text-inviteJurnex-navy/50",
  resumenBox: [
    "list-inside list-disc space-y-1.5 rounded-2xl border-2 border-inviteJurnex-navy/8 bg-white px-5 py-4",
    "text-sm text-inviteJurnex-navy/90 shadow-sm",
  ].join(" "),
  footer: [
    "shrink-0 border-t-2 border-inviteJurnex-navy/10 bg-white",
    "px-4 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom))]",
    "shadow-[0_-8px_32px_rgba(2,24,42,0.08)]",
  ].join(" "),
  backBtn: [
    "min-h-[3rem] flex-1 rounded-full border-2 border-inviteJurnex-navy/15",
    "px-4 py-2.5 text-sm font-semibold text-inviteJurnex-navy",
    "transition hover:bg-inviteJurnex-navy/[0.04] sm:flex-none sm:px-6",
  ].join(" "),
  nextBtn:
    "inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold" +
    rsvpCtaJurnexGold +
    " sm:min-w-[8.5rem] sm:max-w-[14rem] sm:flex-none",
  ctaSolo: [
    "mt-1 inline-flex w-full max-w-sm min-h-[3.15rem] items-center justify-center rounded-full px-8",
    "text-sm font-semibold" + rsvpCtaJurnexGold,
  ].join(" "),
  successBlock: "mx-auto w-full max-w-sm px-0 py-2 motion-safe:animate-rsvpReveal motion-reduce:opacity-100",
  successKicker: "mb-3 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-inviteJurnex-navy/50",
  successTicket: [
    "relative overflow-hidden rounded-2xl border-2 border-inviteJurnex-gold/50 bg-white p-1.5",
    "shadow-[0_28px_64px_-24px_rgba(2,24,42,0.35),inset_0_1px_0_0_rgba(255,255,255,1)]",
  ].join(" "),
  successTicketGlow: "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-inviteJurnex-gold/20 blur-3xl",
  successSelloFrame: [
    "relative z-10 mx-2.5 mt-1 flex min-h-[7.75rem] items-stretch overflow-hidden rounded-xl",
    "border-2 border-dashed border-inviteJurnex-navy/12 bg-inviteJurnex-cream/80",
  ].join(" "),
  successSelloBar: "w-2.5 shrink-0 bg-gradient-to-b from-[#0d9488] to-inviteJurnex-gold/95",
  successSelloCheckOuter: [
    "mx-auto my-auto flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-inviteJurnex-gold",
    "bg-white shadow-jurnex-glow",
    "animate-stampDrop motion-reduce:animate-none",
  ].join(" "),
  successSelloCheckInner:
    "flex h-[2.9rem] w-[2.9rem] items-center justify-center rounded-full bg-inviteJurnex-gold/10 text-3xl text-inviteJurnex-navy animate-boardingValidated motion-reduce:animate-none",
  successStampWord: "pt-1 text-center text-[9px] font-extrabold uppercase tracking-[0.22em] text-inviteJurnex-navy/50",
  successH3: "px-3 pb-0.5 pt-4 text-center font-display text-[1.3rem] font-semibold leading-snug text-inviteJurnex-navy",
  successBody: "px-3.5 text-center text-sm leading-relaxed text-inviteJurnex-navy/80",
  successHint: [
    "mx-1.5 mb-1.5 mt-2 rounded-xl border border-inviteJurnex-navy/8 bg-white px-3 py-3",
    "text-center text-xs leading-relaxed text-inviteJurnex-navy/65",
  ].join(" "),
};

const map: Record<AviationInvitacionVariant, AviationRsvpCheckinUi> = { soft, jurnex };

export function getAviationRsvpCheckinUi(variant: AviationInvitacionVariant): AviationRsvpCheckinUi {
  return map[variant] ?? soft;
}

type RsvpE = "confirmado" | "declinado" | "pendiente";

/** Título principal del estado de éxito. */
export function rsvpExitoTitulo(r: RsvpE): string {
  if (r === "confirmado") return "Te esperamos a bordo";
  if (r === "declinado") return "Gracias por avisarnos";
  return "Listo, respuesta recibida";
}

/** Pista bajo el texto largo. */
export function rsvpExitoPista(r: RsvpE): string {
  if (r === "confirmado") {
    return "Puedes cerrar y seguir con el pase, la carta o el plan. Al confirmar, a veces se abren regalos y música (si la pareja lo activa).";
  }
  if (r === "declinado") {
    return "Puedes volver a la invitación desde aquí. Si cambia el rumbo, actualiza la respuesta en el mismo pase.";
  }
  return "Cierra o elige otra sección. Más adelante puedes ajustar con un toque, desde abajo de la invitación.";
}
