import { Resend } from "resend";
import { buildJurnexEmailShell, escapeHtml, jurnexEmailCta, JURNEX_EMAIL } from "@/lib/email-jurnex-brand";

/**
 * Plantillas y envío de correos del flujo de proveedor (M02).
 * Marca Jurnex y contraste legible (tokens en `email-jurnex-brand`).
 *
 * Si no hay RESEND_API_KEY/FROM, el send devuelve `{ ok: false, motivo: "sin-config" }`
 * sin lanzar — el caller decide si degrada o logs.
 */

type Firma = {
  nombreNegocio: string;
  panelUrl: string;
};

function layout(titulo: string, eyebrow: string, bodyHtml: string): string {
  return buildJurnexEmailShell({
    metaTitle: titulo,
    headerBadge: "JURNEX · PROVEEDORES",
    headerSubtitle: escapeHtml(eyebrow),
    bodyHtml,
    footerHtml: `<span style="color:${JURNEX_EMAIL.footerText};">Jurnex · Marketplace de matrimonios · LATAM</span>`,
  });
}

export function buildBienvenidaPendienteHtml(params: Firma): string {
  const { nombreNegocio, panelUrl } = params;
  return layout(
    "Recibimos tu solicitud",
    "Solicitud recibida",
    `
      <p style="margin: 0 0 10px; font-size: 20px; font-weight: 600; color: ${JURNEX_EMAIL.textTitle};">¡Bienvenido, ${escapeHtml(nombreNegocio)}!</p>
      <p style="margin: 0 0 16px; color: ${JURNEX_EMAIL.textBody}; line-height: 1.55;">
        Recibimos tu solicitud para unirte al marketplace. Nuestro equipo la está revisando y te avisaremos por este correo en un <strong>máximo de 48 horas</strong>.
      </p>
      <p style="margin: 0 0 20px; color: ${JURNEX_EMAIL.textBody}; line-height: 1.55;">
        Mientras tanto, puedes ver cómo quedó tu perfil y completar información extra si lo deseas.
      </p>
      <p style="margin: 0 0 8px;">${jurnexEmailCta(panelUrl, "Ver mi perfil")}</p>
      <p style="margin: 18px 0 0; font-size: 13px; color: ${JURNEX_EMAIL.textMuted}; line-height: 1.55; word-break: break-all;">Si el botón no funciona, copia este enlace:<br /><a href="${escapeHtml(panelUrl)}" style="color: ${JURNEX_EMAIL.linkOnLight}; font-weight: 600;">${escapeHtml(panelUrl)}</a></p>
    `,
  );
}

export function buildAprobadoHtml(params: Firma & { perfilPublicoUrl: string }): string {
  const { nombreNegocio, panelUrl, perfilPublicoUrl } = params;
  return layout(
    "Tu perfil está visible",
    "¡Estás listo para despegar!",
    `
      <p style="margin: 0 0 10px; font-size: 20px; font-weight: 600; color: ${JURNEX_EMAIL.textTitle};">${escapeHtml(nombreNegocio)}, tu perfil ya es visible ✈️</p>
      <p style="margin: 0 0 16px; color: ${JURNEX_EMAIL.textBody}; line-height: 1.55;">
        Las parejas que están organizando su boda ya pueden descubrirte en el marketplace. Queremos ayudarte a convertir esos contactos en experiencias inolvidables.
      </p>
      <p style="margin: 0 0 8px;">${jurnexEmailCta(perfilPublicoUrl, "Ver mi perfil público")}</p>
      <p style="margin: 0 0 10px; color: ${JURNEX_EMAIL.textBody}; line-height: 1.55;">
        Para maximizar tus contactos, te recomendamos:
      </p>
      <ul style="margin: 0 0 20px 20px; color: ${JURNEX_EMAIL.textBody}; line-height: 1.55;">
        <li>Subir al menos 3 fotos de trabajos recientes.</li>
        <li>Completar tu biografía con tu propuesta diferencial.</li>
        <li>Configurar el precio desde para cada servicio.</li>
      </ul>
      <p style="margin: 0 0 8px;"><a href="${escapeHtml(panelUrl)}" style="color: ${JURNEX_EMAIL.linkOnLight}; font-weight: 600;">Ir a mi panel →</a></p>
    `,
  );
}

export function buildSuspendidoHtml(
  params: Firma & { motivo: string; detalle?: string },
): string {
  const { nombreNegocio, panelUrl, motivo, detalle } = params;
  const motivoLabels: Record<string, string> = {
    incompleto: "Tu perfil necesita más información",
    "baja-calidad": "Las fotos o la descripción no cumplen el estándar del marketplace",
    duplicado: "Ya tenemos un perfil similar del mismo negocio",
    otro: "Necesitamos aclarar algunos detalles",
  };
  const titulo = motivoLabels[motivo] ?? motivoLabels.otro;

  return layout(
    "Una info más para activar tu perfil",
    "Necesitamos algo más",
    `
      <p style="margin: 0 0 10px; font-size: 20px; font-weight: 600; color: ${JURNEX_EMAIL.textTitle};">Hola ${escapeHtml(nombreNegocio)},</p>
      <p style="margin: 0 0 16px; color: ${JURNEX_EMAIL.textBody}; line-height: 1.55;">
        Revisamos tu solicitud y <strong>${escapeHtml(titulo)}</strong>.
      </p>
      ${
        detalle
          ? `<p style="margin: 0 0 16px; padding: 14px 16px; background: ${JURNEX_EMAIL.noticeBg}; border-left: 4px solid ${JURNEX_EMAIL.noticeBorder}; color: ${JURNEX_EMAIL.noticeText}; line-height: 1.55;">${escapeHtml(detalle)}</p>`
          : ""
      }
      <p style="margin: 0 0 20px; color: ${JURNEX_EMAIL.textBody}; line-height: 1.55;">
        Puedes editar tu perfil desde el panel y responder a este correo para que lo revisemos nuevamente.
      </p>
      <p style="margin: 0 0 8px;">${jurnexEmailCta(panelUrl, "Editar mi perfil")}</p>
      <p style="margin: 18px 0 0; font-size: 13px; color: ${JURNEX_EMAIL.textMuted}; line-height: 1.55;">
        ¿Tienes dudas? Responde a este correo o escríbenos a <a href="mailto:hola@jurnex.cl" style="color: ${JURNEX_EMAIL.linkOnLight}; font-weight: 600;">hola@jurnex.cl</a>.
      </p>
    `,
  );
}

export function buildAdminNuevoProveedorHtml(params: {
  nombreNegocio: string;
  categoria: string;
  region: string;
  panelAdminUrl: string;
  email: string;
}): string {
  const { nombreNegocio, categoria, region, panelAdminUrl, email } = params;
  return layout(
    "Nuevo proveedor pendiente",
    "Admin · Revisión requerida",
    `
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 600; color: ${JURNEX_EMAIL.textTitle};">Nuevo proveedor esperando aprobación</p>
      <table cellpadding="0" cellspacing="0" style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 6px 12px 6px 0; color: ${JURNEX_EMAIL.textMuted}; font-size: 13px;">Negocio</td><td style="padding: 6px 0; font-weight: 600; color: ${JURNEX_EMAIL.textBody};">${escapeHtml(nombreNegocio)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: ${JURNEX_EMAIL.textMuted}; font-size: 13px;">Contacto</td><td style="padding: 6px 0; color: ${JURNEX_EMAIL.textBody};">${escapeHtml(email)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: ${JURNEX_EMAIL.textMuted}; font-size: 13px;">Categoría</td><td style="padding: 6px 0; color: ${JURNEX_EMAIL.textBody};">${escapeHtml(categoria)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: ${JURNEX_EMAIL.textMuted}; font-size: 13px;">Región</td><td style="padding: 6px 0; color: ${JURNEX_EMAIL.textBody};">${escapeHtml(region)}</td></tr>
      </table>
      <p style="margin: 0 0 8px;">${jurnexEmailCta(panelAdminUrl, "Revisar en el panel")}</p>
      <p style="margin: 18px 0 0; font-size: 13px; color: ${JURNEX_EMAIL.textMuted};">SLA objetivo: 48 horas.</p>
    `,
  );
}

/** Resultado de envío. No lanza; el caller decide si degrada. */
export type EnvioEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; motivo: "sin-config" | "error"; detalle?: string };

export async function enviarEmailProveedor(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EnvioEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[proveedor-emails] RESEND no configurado. Skip send.", {
        to: params.to,
        subject: params.subject,
      });
    }
    return { ok: false, motivo: "sin-config" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      return { ok: false, motivo: "error", detalle: error.message };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    return {
      ok: false,
      motivo: "error",
      detalle: err instanceof Error ? err.message : "error desconocido",
    };
  }
}

/** Lista de admins para notificar sobre nuevo proveedor. */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
