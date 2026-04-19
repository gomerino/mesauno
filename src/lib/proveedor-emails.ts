import { Resend } from "resend";

/**
 * Plantillas y envío de correos del flujo de proveedor (M02).
 *
 * Paleta brand:
 * - Navy #001d66 (idéntico a invitaciones).
 * - Dorado premium #c8a15a para acentos.
 *
 * Convención: cada template es una función pura `build*Html(params)` que
 * devuelve el HTML. El wrapper `enviarEmailProveedor` hace el send con Resend.
 *
 * Si no hay RESEND_API_KEY/FROM, el send devuelve `{ ok: false, motivo: "sin-config" }`
 * sin lanzar — el caller decide si degrada o logs.
 */

const NAVY = "#001d66";
const GOLD = "#c8a15a";

type Firma = {
  nombreNegocio: string;
  panelUrl: string;
};

function layout(titulo: string, eyebrow: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${escapar(titulo)}</title></head>
<body style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f6f5f1; margin: 0; padding: 24px; color: #111;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 32px rgba(0,0,0,0.08);">
      <tr><td style="background: ${NAVY}; padding: 22px 24px; border-bottom: 3px solid ${GOLD};">
        <p style="margin: 0; color: #fff; font-size: 13px; letter-spacing: 0.14em; font-weight: 700;">JURNEX · PROVEEDORES</p>
        <p style="margin: 8px 0 0; color: #dfe4f5; font-size: 13px;">${escapar(eyebrow)}</p>
      </td></tr>
      <tr><td style="padding: 28px 26px;">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding: 18px 26px; background: #f6f5f1; color: #777; font-size: 12px; text-align: center;">
        Jurnex · Marketplace de matrimonios — Chile.
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

function cta(href: string, texto: string): string {
  return `<a href="${escapar(href)}" style="display: inline-block; background: ${NAVY}; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; font-size: 15px;">${escapar(texto)}</a>`;
}

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildBienvenidaPendienteHtml(params: Firma): string {
  const { nombreNegocio, panelUrl } = params;
  return layout(
    "Recibimos tu solicitud",
    "Solicitud recibida",
    `
      <p style="margin: 0 0 10px; font-size: 20px; font-weight: 600;">¡Bienvenido, ${escapar(nombreNegocio)}!</p>
      <p style="margin: 0 0 16px; color: #444; line-height: 1.55;">
        Recibimos tu solicitud para sumarte al marketplace. Nuestro equipo la está revisando y te avisaremos por este correo en un <strong>máximo de 48 horas</strong>.
      </p>
      <p style="margin: 0 0 20px; color: #444; line-height: 1.55;">
        Mientras tanto, podés ver cómo quedó tu perfil y completar información extra si querés.
      </p>
      <p style="margin: 0 0 8px;">${cta(panelUrl, "Ver mi perfil")}</p>
      <p style="margin: 18px 0 0; font-size: 12px; color: #888; word-break: break-all;">Si el botón no funciona, copia este enlace: ${escapar(panelUrl)}</p>
    `,
  );
}

export function buildAprobadoHtml(params: Firma & { perfilPublicoUrl: string }): string {
  const { nombreNegocio, panelUrl, perfilPublicoUrl } = params;
  return layout(
    "Tu perfil está visible",
    "¡Estás listo para despegar!",
    `
      <p style="margin: 0 0 10px; font-size: 20px; font-weight: 600;">${escapar(nombreNegocio)}, tu perfil ya es visible ✈️</p>
      <p style="margin: 0 0 16px; color: #444; line-height: 1.55;">
        Los novios que están armando su boda ya pueden descubrirte en el marketplace. Queremos ayudarte a convertir esos contactos en experiencias inolvidables.
      </p>
      <p style="margin: 0 0 8px;">${cta(perfilPublicoUrl, "Ver mi perfil público")}</p>
      <p style="margin: 18px 0 10px; color: #444; line-height: 1.55;">
        Para maximizar leads, te recomendamos:
      </p>
      <ul style="margin: 0 0 20px 20px; color: #444; line-height: 1.55;">
        <li>Subir al menos 3 fotos de trabajos recientes.</li>
        <li>Completar tu bio con tu propuesta diferencial.</li>
        <li>Configurar precio desde para cada servicio.</li>
      </ul>
      <p style="margin: 0 0 8px;"><a href="${escapar(panelUrl)}" style="color: ${NAVY}; font-weight: 600;">Ir a mi panel →</a></p>
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
      <p style="margin: 0 0 10px; font-size: 20px; font-weight: 600;">Hola ${escapar(nombreNegocio)},</p>
      <p style="margin: 0 0 16px; color: #444; line-height: 1.55;">
        Revisamos tu solicitud y <strong>${escapar(titulo)}</strong>.
      </p>
      ${
        detalle
          ? `<p style="margin: 0 0 16px; padding: 12px 14px; background: #fff8e9; border-left: 3px solid ${GOLD}; color: #444; line-height: 1.55;">${escapar(detalle)}</p>`
          : ""
      }
      <p style="margin: 0 0 20px; color: #444; line-height: 1.55;">
        Podés editar tu perfil desde el panel y responder a este correo para que lo revisemos de nuevo.
      </p>
      <p style="margin: 0 0 8px;">${cta(panelUrl, "Editar mi perfil")}</p>
      <p style="margin: 18px 0 0; font-size: 12px; color: #888;">¿Dudas? Respondenos a este correo o escribinos a <a href="mailto:hola@jurnex.cl" style="color: ${NAVY};">hola@jurnex.cl</a>.</p>
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
      <p style="margin: 0 0 10px; font-size: 18px; font-weight: 600;">Nuevo proveedor esperando aprobación</p>
      <table cellpadding="0" cellspacing="0" style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 6px 12px 6px 0; color: #888; font-size: 13px;">Negocio</td><td style="padding: 6px 0; font-weight: 600;">${escapar(nombreNegocio)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #888; font-size: 13px;">Contacto</td><td style="padding: 6px 0;">${escapar(email)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #888; font-size: 13px;">Categoría</td><td style="padding: 6px 0;">${escapar(categoria)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #888; font-size: 13px;">Región</td><td style="padding: 6px 0;">${escapar(region)}</td></tr>
      </table>
      <p style="margin: 0 0 8px;">${cta(panelAdminUrl, "Revisar en el panel")}</p>
      <p style="margin: 18px 0 0; font-size: 12px; color: #888;">SLA objetivo: 48 horas.</p>
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
