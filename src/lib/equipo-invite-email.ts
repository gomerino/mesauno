import { buildJurnexEmailShell, escapeHtml, jurnexEmailCta, JURNEX_EMAIL } from "@/lib/email-jurnex-brand";

export function buildEquipoInviteEmailHtml(params: {
  actionLink: string;
  eventoLabel: string;
  rolLabel: string;
}): string {
  const { actionLink, eventoLabel, rolLabel } = params;
  const ev = escapeHtml(eventoLabel);
  const rol = escapeHtml(rolLabel);

  const bodyHtml = `
        <p style="margin:0 0 14px;font-size:18px;font-weight:600;color:${JURNEX_EMAIL.textTitle};">Te invitan al equipo del evento</p>
        <p style="margin:0 0 22px;color:${JURNEX_EMAIL.textBody};">
          <strong>${ev}</strong> te suma con el rol <strong>${rol}</strong>. Usa el enlace para crear tu cuenta o entrar y unirte al equipo en Jurnex.
        </p>
        <p style="margin:0 0 22px;">${jurnexEmailCta(actionLink, "Aceptar invitación")}</p>
        <p style="margin:0;font-size:13px;color:${JURNEX_EMAIL.textMuted};line-height:1.55;word-break:break-word;">
          Si el botón no funciona:<br />
          <a href="${escapeHtml(actionLink)}" style="color:${JURNEX_EMAIL.linkOnLight};font-weight:600;">${escapeHtml(actionLink)}</a>
        </p>`;

  return buildJurnexEmailShell({
    metaTitle: "Invitación al equipo — Jurnex",
    headerBadge: "JURNEX",
    headerSubtitle: "Equipo del evento · Tu boda, tu viaje",
    bodyHtml,
  });
}
