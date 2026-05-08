import { buildJurnexEmailShell, escapeHtml, jurnexEmailCta, JURNEX_EMAIL } from "@/lib/email-jurnex-brand";

export function buildInvitacionEmailHtml(params: {
  link: string;
  firmantes: string;
  saludoNombres: string;
}): string {
  const { link, firmantes, saludoNombres } = params;
  const saludo = saludoNombres.trim() ? escapeHtml(saludoNombres.trim()) : "";
  const firm = escapeHtml(firmantes);

  const bodyHtml = `
        <p style="margin:0 0 14px;font-size:18px;font-weight:600;color:${JURNEX_EMAIL.textTitle};">Hola${saludo ? `, ${saludo}` : ""}</p>
        <p style="margin:0 0 22px;color:${JURNEX_EMAIL.textBody};">
          <strong>${firm}</strong> te envían tu pase de embarque para el gran día. Abre el enlace para ver tu invitación y confirmar asistencia.
        </p>
        <p style="margin:0 0 22px;">${jurnexEmailCta(link, "Ver mi invitación")}</p>
        <p style="margin:0;font-size:13px;color:${JURNEX_EMAIL.textMuted};line-height:1.55;word-break:break-word;">
          Si el botón no funciona, copia este enlace en el navegador:<br />
          <a href="${escapeHtml(link)}" style="color:${JURNEX_EMAIL.linkOnLight};font-weight:600;">${escapeHtml(link)}</a>
        </p>`;

  return buildJurnexEmailShell({
    metaTitle: "Tu invitación — Jurnex",
    headerBadge: "JURNEX",
    headerSubtitle: "Tu boda, tu viaje · Invitación digital",
    bodyHtml,
  });
}

/** Correo de insistencia para quienes aún no confirman RSVP. */
export function buildRecordatorioEmailHtml(params: {
  link: string;
  firmantes: string;
  saludoNombres: string;
}): string {
  const { link, firmantes, saludoNombres } = params;
  const saludo = saludoNombres.trim() ? escapeHtml(saludoNombres.trim()) : "";
  const firm = escapeHtml(firmantes);

  const bodyHtml = `
        <p style="margin:0 0 14px;font-size:18px;font-weight:600;color:${JURNEX_EMAIL.textTitle};">Hola${saludo ? `, ${saludo}` : ""}</p>
        <p style="margin:0 0 22px;color:${JURNEX_EMAIL.textBody};">
          Aún no hemos recibido tu confirmación de asistencia. <strong>${firm}</strong> te recuerdan amablemente que puedes responder desde tu invitación digital.
        </p>
        <p style="margin:0 0 22px;">${jurnexEmailCta(link, "Confirmar asistencia")}</p>
        <p style="margin:0;font-size:13px;color:${JURNEX_EMAIL.textMuted};line-height:1.55;word-break:break-word;">
          Si el botón no funciona:<br />
          <a href="${escapeHtml(link)}" style="color:${JURNEX_EMAIL.linkOnLight};font-weight:600;">${escapeHtml(link)}</a>
        </p>`;

  return buildJurnexEmailShell({
    metaTitle: "Recordatorio — Jurnex",
    headerBadge: "JURNEX",
    headerSubtitle: "Recordatorio de confirmación",
    bodyHtml,
  });
}
