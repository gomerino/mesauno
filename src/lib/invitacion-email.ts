export function buildInvitacionEmailHtml(params: {
  link: string;
  firmantes: string;
  saludoNombres: string;
}): string {
  const { link, firmantes, saludoNombres } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; background: #f0f0f0; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background: #001d66; padding: 20px 24px;">
        <p style="margin: 0; color: #fff; font-size: 14px; letter-spacing: 0.12em; font-weight: 700;">DREAMS AIRLINES</p>
        <p style="margin: 8px 0 0; color: #c7d4ff; font-size: 13px;">Invitación digital</p>
      </td></tr>
      <tr><td style="padding: 28px 24px;">
        <p style="margin: 0 0 12px; font-size: 18px; color: #111;">Hola${saludoNombres ? `, ${saludoNombres}` : ""}</p>
        <p style="margin: 0 0 20px; color: #444; line-height: 1.5;">
          ${firmantes} te envían tu pase de embarque para el gran día. Abre el enlace para ver tu invitación y confirmar asistencia.
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${link}" style="display: inline-block; background: #001d66; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 600;">Ver mi invitación</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #888; word-break: break-all;">Si el botón no funciona, copia este enlace: ${link}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

/** Correo de insistencia para quienes aún no confirman RSVP. */
export function buildRecordatorioEmailHtml(params: {
  link: string;
  firmantes: string;
  saludoNombres: string;
}): string {
  const { link, firmantes, saludoNombres } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; background: #f0f0f0; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background: #001d66; padding: 20px 24px;">
        <p style="margin: 0; color: #fff; font-size: 14px; letter-spacing: 0.12em; font-weight: 700;">DREAMS AIRLINES</p>
        <p style="margin: 8px 0 0; color: #c7d4ff; font-size: 13px;">Recordatorio</p>
      </td></tr>
      <tr><td style="padding: 28px 24px;">
        <p style="margin: 0 0 12px; font-size: 18px; color: #111;">Hola${saludoNombres ? `, ${saludoNombres}` : ""}</p>
        <p style="margin: 0 0 20px; color: #444; line-height: 1.5;">
          Aún no hemos recibido tu confirmación de asistencia. ${firmantes} te recuerdan amablemente que puedes responder desde tu invitación digital.
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${link}" style="display: inline-block; background: #001d66; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 600;">Confirmar asistencia</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #888; word-break: break-all;">Si el botón no funciona: ${link}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}
