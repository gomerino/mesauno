/**
 * Marca y contraste para correos HTML (tablas + estilos inline).
 * Fondo claro + texto slate oscuro (≥ AA sobre blanco); cabecera navy + texto claro.
 */

export const JURNEX_EMAIL = {
  pageBg: "#eef2f7",
  cardBg: "#ffffff",
  navyHeader: "#02182a",
  headerAccentBorder: "#e89a1e",
  textOnNavy: "#ffffff",
  subtitleOnNavy: "#e2e8f0",
  textTitle: "#0f172a",
  textBody: "#334155",
  textMuted: "#475569",
  footerBg: "#f1f5f9",
  footerText: "#475569",
  /** Enlaces sobre fondo claro — teal oscuro, contraste AA */
  linkOnLight: "#0f766e",
  ctaBg: "#02182a",
  ctaText: "#ffffff",
  noticeBg: "#fffbeb",
  noticeBorder: "#e89a1e",
  noticeText: "#334155",
} as const;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function jurnexEmailCta(href: string, label: string): string {
  const E = JURNEX_EMAIL;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${E.ctaBg};color:${E.ctaText};text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px;line-height:1.3;">${escapeHtml(label)}</a>`;
}

type ShellParams = {
  metaTitle?: string;
  headerBadge: string;
  headerSubtitle: string;
  bodyHtml: string;
  /** HTML interno del pie (solo contenido generado por nosotros). */
  footerHtml?: string;
};

export function buildJurnexEmailShell(params: ShellParams): string {
  const { metaTitle = "Jurnex", headerBadge, headerSubtitle, bodyHtml, footerHtml } = params;
  const E = JURNEX_EMAIL;
  const footer =
    footerHtml ??
    `<span style="color:${E.footerText};">Jurnex · Tu boda, tu viaje</span>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(metaTitle)}</title></head>
<body style="margin:0;padding:24px;background:${E.pageBg};font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:${E.textBody};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${E.cardBg};border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(2,24,42,0.12);">
      <tr><td style="background:${E.navyHeader};padding:22px 24px;border-bottom:3px solid ${E.headerAccentBorder};">
        <p style="margin:0;color:${E.textOnNavy};font-size:15px;font-weight:700;letter-spacing:0.06em;">${headerBadge}</p>
        <p style="margin:10px 0 0;color:${E.subtitleOnNavy};font-size:14px;line-height:1.5;">${headerSubtitle}</p>
      </td></tr>
      <tr><td style="padding:28px 24px;color:${E.textBody};font-size:16px;line-height:1.55;">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:18px 24px;background:${E.footerBg};font-size:13px;line-height:1.5;text-align:center;">
        ${footer}
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}
