/**
 * Normaliza URL de lista de regalos para uso seguro en la invitación.
 * Solo permite http(s); devuelve null si está vacío o es inválido.
 */
export function normalizeRegalosUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProtocol);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export const TEXTO_REGALOS_DEFAULT =
  "Si quieres acompañarnos con un regalo, puedes visitar nuestra lista.";
