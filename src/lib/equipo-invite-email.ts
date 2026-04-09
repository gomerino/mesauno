export function buildEquipoInviteEmailHtml(params: {
  actionLink: string;
  eventoLabel: string;
  rolLabel: string;
}): string {
  const { actionLink, eventoLabel, rolLabel } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; background: #f0f0f0; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background: #001d66; padding: 20px 24px;">
        <p style="margin: 0; color: #fff; font-size: 14px; letter-spacing: 0.12em; font-weight: 700;">MESA UNO</p>
        <p style="margin: 8px 0 0; color: #c7d4ff; font-size: 13px;">Invitación al equipo del evento</p>
      </td></tr>
      <tr><td style="padding: 28px 24px;">
        <p style="margin: 0 0 12px; font-size: 18px; color: #111;">Has sido invitado/a</p>
        <p style="margin: 0 0 20px; color: #444; line-height: 1.5;">
          <strong>${eventoLabel}</strong> te añade al equipo con el rol: <strong>${rolLabel}</strong>.
          Crea tu cuenta o entra con el enlace para unirte.
        </p>
        <p style="margin: 0 0 24px;">
          <a href="${actionLink}" style="display: inline-block; background: #001d66; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 600;">Aceptar invitación</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #888; word-break: break-all;">Si el botón no funciona: ${actionLink}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}
