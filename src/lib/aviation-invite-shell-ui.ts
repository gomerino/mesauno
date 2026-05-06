import type { AviationInvitacionVariant } from "@/components/themes/AviationInvitacionContext";

/** Clases reutilizables en `SoftAviationSpaShell` (Premium vs Jurnex Aviation). */
export type AviationInviteShellUi = {
  pageRoot: string;
  modalBackdrop: string;
  modalPanel: string;
  modalHeader: string;
  modalTitle: string;
  modalClose: string;
  modalHint: string;
  modalQrBox: string;
  aside: string;
  /** Borde superior del bloque QR bajo el rail (desktop) */
  asideQrTop: string;
  navBtn: string;
  navBtnActive: string;
  navBar: string;
  /** Icono de pestaña activa (mismo color que el texto de nav activo) */
  navIconActive: string;
  qrAsideBtn: string;
  albumCard: string;
  albumEmpty: string;
  playlistIntro: string;
  escucharHeading: string;
  appleCard: string;
  appleIcon: string;
  appleMusicLabel: string;
  spotifyLink: string;
  otherLink: string;
  colabSectionBorder: string; /** con padding-top si hay playlist */
  colabHeading: string;
  colabNote: string;
  colabEmpty: string;
  itinIntro: string;
  itinBox: string;
  itinEmpty: string;
  footerBand: string;
  mobileNav: string;
  mobileNavHint: string;
  mobileNavBtn: string;
  mobileNavBtnActive: string;
  mobileQrBtn: string;
};

const soft: AviationInviteShellUi = {
  pageRoot:
    "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-invite-sand font-inviteBody text-invite-navy antialiased [color-scheme:light]",
  modalBackdrop: "absolute inset-0 bg-invite-navy/45 backdrop-blur-[2px]",
  modalPanel: "relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-invite-navy/12 bg-invite-sand shadow-2xl",
  modalHeader: "flex items-center justify-between border-b border-invite-navy/10 bg-white/90 px-3 py-2.5",
  modalTitle: "font-inviteSerif text-base font-semibold text-invite-navy",
  modalClose: "rounded-full p-2 text-invite-navy/50 transition hover:bg-invite-navy/5 hover:text-invite-navy",
  modalHint: "mb-2 text-center text-xs text-invite-navy/60",
  modalQrBox: "rounded-xl border border-invite-navy/10 bg-white",
  aside:
    "hidden w-[4.75rem] shrink-0 flex-col border-r border-invite-navy/10 bg-white/95 shadow-[2px_0_12px_rgba(26,43,72,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-white/88 md:flex",
  asideQrTop: "shrink-0 border-t border-invite-navy/10 px-1 py-2",
  navBtn: "text-invite-navy/50 hover:bg-invite-navy/5 hover:text-invite-navy/85",
  navBtnActive: "bg-invite-gold/26 text-invite-navy shadow-[0_6px_14px_rgba(26,43,72,0.14)] ring-1 ring-invite-gold/45",
  navBar: "bg-invite-gold",
  navIconActive: "text-invite-navy",
  qrAsideBtn:
    "flex w-full flex-col items-center gap-0.5 rounded-lg py-2 text-invite-navy/70 transition hover:bg-invite-gold/15 hover:text-invite-navy",
  albumCard:
    "rounded-2xl border border-invite-navy/10 bg-white p-4 shadow-sm [&_h2]:font-inviteSerif [&_h2]:text-invite-navy [&_p]:text-invite-navy/70",
  albumEmpty: "rounded-2xl border border-dashed border-invite-navy/15 bg-white/80 p-8 text-center text-sm text-invite-navy/60",
  playlistIntro: "mb-5 text-center text-xs leading-relaxed text-invite-navy/70",
  escucharHeading: "mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-invite-navy/45",
  appleCard:
    "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-invite-gold bg-invite-navy px-6 py-6 text-center shadow-md transition hover:brightness-110",
  appleIcon: "flex h-12 w-12 items-center justify-center rounded-full bg-invite-gold/20 text-white ring-2 ring-invite-gold/50",
  appleMusicLabel: "text-[10px] font-semibold uppercase tracking-[0.25em] text-invite-gold",
  spotifyLink:
    "flex w-full items-center justify-center gap-2 rounded-full border-2 border-invite-navy/15 bg-white px-5 py-3 text-sm font-semibold text-invite-navy shadow-sm transition hover:border-invite-gold/60 hover:bg-invite-cream",
  otherLink:
    "text-center text-sm font-medium text-invite-navy underline decoration-invite-gold decoration-2 underline-offset-4 hover:text-invite-gold",
  colabSectionBorder: "border-t border-invite-navy/10 pt-2",
  colabHeading: "mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-invite-navy/45",
  colabNote: "border-t border-invite-navy/10 pt-6 text-center text-xs text-invite-navy/55",
  colabEmpty: "text-center text-sm text-invite-navy/55",
  itinIntro: "mb-2 text-center text-xs text-invite-navy/65",
  itinBox: "rounded-2xl border border-invite-navy/10 bg-white p-3 shadow-sm sm:p-4 [&_.font-display]:font-inviteSerif",
  itinEmpty: "rounded-2xl border border-dashed border-invite-navy/15 bg-white/80 p-8 text-center text-sm text-invite-navy/60",
  footerBand:
    "shrink-0 border-t border-invite-navy/8 bg-invite-sand/95 px-2 pt-2 pb-2 shadow-[0_-4px_20px_rgba(26,43,72,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-invite-sand/88 md:pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]",
  mobileNav:
    "fixed inset-x-0 bottom-0 z-[8800] overflow-hidden border-t border-invite-navy/14 bg-white md:hidden",
  mobileNavHint: "px-2 pt-1.5 text-center text-[10px] leading-tight text-invite-navy/60",
  mobileNavBtn: "text-invite-navy/50 active:bg-invite-navy/5",
  mobileNavBtnActive: "bg-invite-gold/22 text-invite-navy ring-1 ring-invite-gold/35",
  mobileQrBtn:
    "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center rounded-xl py-1 text-invite-navy/70 touch-manipulation transition active:scale-[0.97] active:bg-invite-gold/18",
};

const jurnex: AviationInviteShellUi = {
  pageRoot:
    "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-inviteJurnex-sand font-inviteBody text-inviteJurnex-navy antialiased [color-scheme:light]",
  modalBackdrop: "absolute inset-0 bg-inviteJurnex-navy/50 backdrop-blur-[2px]",
  modalPanel:
    "relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-inviteJurnex-navy/12 bg-inviteJurnex-cream shadow-2xl",
  modalHeader: "flex items-center justify-between border-b border-inviteJurnex-navy/10 bg-white/90 px-3 py-2.5",
  modalTitle: "font-display text-base font-semibold text-inviteJurnex-navy",
  modalClose:
    "rounded-full p-2 text-inviteJurnex-navy/50 transition hover:bg-inviteJurnex-navy/5 hover:text-inviteJurnex-navy",
  modalHint: "mb-2 text-center text-xs text-inviteJurnex-navy/60",
  modalQrBox: "rounded-xl border border-inviteJurnex-navy/10 bg-white",
  aside:
    "hidden w-[4.75rem] shrink-0 flex-col border-r border-inviteJurnex-navy/10 bg-white/95 shadow-[2px_0_12px_rgba(2,24,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/88 md:flex",
  asideQrTop: "shrink-0 border-t border-inviteJurnex-navy/10 px-1 py-2",
  navBtn: "text-inviteJurnex-navy/50 hover:bg-inviteJurnex-navy/5 hover:text-inviteJurnex-navy/85",
  navBtnActive:
    "bg-inviteJurnex-gold/24 text-inviteJurnex-navy shadow-[0_6px_14px_rgba(2,24,42,0.14)] ring-1 ring-inviteJurnex-gold/45",
  navBar: "bg-inviteJurnex-gold",
  navIconActive: "text-inviteJurnex-navy",
  qrAsideBtn:
    "flex w-full flex-col items-center gap-0.5 rounded-lg py-2 text-inviteJurnex-navy/70 transition hover:bg-inviteJurnex-gold/15 hover:text-inviteJurnex-navy",
  albumCard:
    "rounded-2xl border border-inviteJurnex-navy/10 bg-white p-4 shadow-sm [&_h2]:font-display [&_h2]:text-inviteJurnex-navy [&_p]:text-inviteJurnex-navy/70",
  albumEmpty:
    "rounded-2xl border border-dashed border-inviteJurnex-navy/15 bg-white/80 p-8 text-center text-sm text-inviteJurnex-navy/60",
  playlistIntro: "mb-5 text-center text-xs leading-relaxed text-inviteJurnex-navy/70",
  escucharHeading: "mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-inviteJurnex-navy/45",
  appleCard:
    "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-inviteJurnex-gold bg-inviteJurnex-navy px-6 py-6 text-center shadow-md transition hover:brightness-110",
  appleIcon:
    "flex h-12 w-12 items-center justify-center rounded-full bg-inviteJurnex-gold/20 text-white ring-2 ring-inviteJurnex-gold/50",
  appleMusicLabel: "text-[10px] font-semibold uppercase tracking-[0.25em] text-inviteJurnex-gold-bright",
  spotifyLink:
    "flex w-full items-center justify-center gap-2 rounded-full border-2 border-inviteJurnex-navy/15 bg-white px-5 py-3 text-sm font-semibold text-inviteJurnex-navy shadow-sm transition hover:border-inviteJurnex-gold/50 hover:bg-inviteJurnex-cream",
  otherLink:
    "text-center text-sm font-medium text-inviteJurnex-navy underline decoration-inviteJurnex-gold decoration-2 underline-offset-4 hover:text-inviteJurnex-gold",
  colabSectionBorder: "border-t border-inviteJurnex-navy/10 pt-2",
  colabHeading: "mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-inviteJurnex-navy/45",
  colabNote: "border-t border-inviteJurnex-navy/10 pt-6 text-center text-xs text-inviteJurnex-navy/55",
  colabEmpty: "text-center text-sm text-inviteJurnex-navy/55",
  itinIntro: "mb-2 text-center text-xs text-inviteJurnex-navy/65",
  itinBox:
    "rounded-2xl border border-inviteJurnex-navy/10 bg-white p-3 shadow-sm sm:p-4 [&_.font-display]:font-display",
  itinEmpty:
    "rounded-2xl border border-dashed border-inviteJurnex-navy/15 bg-white/80 p-8 text-center text-sm text-inviteJurnex-navy/60",
  footerBand:
    "shrink-0 border-t border-inviteJurnex-navy/8 bg-inviteJurnex-sand/95 px-2 pt-2 pb-2 shadow-[0_-4px_20px_rgba(2,24,42,0.05)] backdrop-blur-md supports-[backdrop-filter]:bg-inviteJurnex-sand/90 md:pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]",
  mobileNav:
    "fixed inset-x-0 bottom-0 z-[8800] overflow-hidden border-t border-inviteJurnex-navy/14 bg-white md:hidden",
  mobileNavHint: "px-2 pt-1.5 text-center text-[10px] leading-tight text-inviteJurnex-navy/60",
  mobileNavBtn: "text-inviteJurnex-navy/50 active:bg-inviteJurnex-navy/5",
  mobileNavBtnActive: "bg-inviteJurnex-gold/20 text-inviteJurnex-navy ring-1 ring-inviteJurnex-gold/40",
  mobileQrBtn:
    "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center rounded-xl py-1 text-inviteJurnex-navy/70 touch-manipulation transition active:scale-[0.97] active:bg-inviteJurnex-gold/18",
};

const map: Record<AviationInvitacionVariant, AviationInviteShellUi> = { soft, jurnex };

export function getAviationInviteShellUi(variant: AviationInvitacionVariant): AviationInviteShellUi {
  return map[variant] ?? soft;
}
