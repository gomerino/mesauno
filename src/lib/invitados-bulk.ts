/**
 * Parseo de líneas pegadas por el usuario para importación masiva de invitados.
 *
 * Formatos soportados por línea:
 *   - "Nombre"
 *   - "Nombre, email"
 *   - "Nombre, email, teléfono"
 *
 * Campos extra se ignoran; separadores aceptados: coma, punto y coma, tab.
 */

export type BulkParseStatus = "new" | "duplicate" | "invalid";

export type BulkParsedRow = {
  /** 1-based para mostrar en UI */
  lineNumber: number;
  raw: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  status: BulkParseStatus;
  reason?: string;
};

export type BulkParseSummary = {
  rows: BulkParsedRow[];
  counts: {
    total: number;
    new: number;
    duplicate: number;
    invalid: number;
  };
};

export type ExistingGuest = {
  nombre_pasajero: string | null;
  email: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeName(v: string): string {
  return v.trim().toLowerCase();
}

function normalizeEmail(v: string | null): string {
  return (v ?? "").trim().toLowerCase();
}

/** Parsea el contenido pegado y clasifica cada línea. */
export function parseBulkInvitados(
  raw: string,
  existing: ExistingGuest[],
): BulkParseSummary {
  const lines = raw.split(/\r?\n/);
  const existingNames = new Set(
    existing.map((g) => normalizeName(g.nombre_pasajero ?? "")).filter(Boolean),
  );
  const existingEmails = new Set(
    existing.map((g) => normalizeEmail(g.email)).filter(Boolean),
  );

  const seenNamesInBatch = new Set<string>();
  const seenEmailsInBatch = new Set<string>();

  const rows: BulkParsedRow[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const parts = trimmed
      .split(/[,;\t]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const nombre = parts[0] ?? "";
    const emailCandidate = parts[1] ?? "";
    const telefonoCandidate = parts[2] ?? "";

    if (nombre.length < 2) {
      rows.push({
        lineNumber: idx + 1,
        raw: trimmed,
        nombre: nombre,
        email: null,
        telefono: null,
        status: "invalid",
        reason: "Nombre demasiado corto",
      });
      return;
    }

    const email = emailCandidate.length > 0 ? emailCandidate : null;
    if (email && !EMAIL_RE.test(email)) {
      rows.push({
        lineNumber: idx + 1,
        raw: trimmed,
        nombre,
        email: null,
        telefono: null,
        status: "invalid",
        reason: "Email con formato inválido",
      });
      return;
    }

    const telefono = telefonoCandidate.length > 0 ? telefonoCandidate : null;

    const nombreKey = normalizeName(nombre);
    const emailKey = email ? normalizeEmail(email) : "";

    const isDupExisting =
      existingNames.has(nombreKey) || (emailKey.length > 0 && existingEmails.has(emailKey));

    const isDupInBatch =
      seenNamesInBatch.has(nombreKey) ||
      (emailKey.length > 0 && seenEmailsInBatch.has(emailKey));

    if (isDupExisting || isDupInBatch) {
      rows.push({
        lineNumber: idx + 1,
        raw: trimmed,
        nombre,
        email,
        telefono,
        status: "duplicate",
        reason: isDupExisting ? "Ya existe en la lista" : "Repetido en este bloque",
      });
      return;
    }

    seenNamesInBatch.add(nombreKey);
    if (emailKey) seenEmailsInBatch.add(emailKey);

    rows.push({
      lineNumber: idx + 1,
      raw: trimmed,
      nombre,
      email,
      telefono,
      status: "new",
    });
  });

  const counts = rows.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] += 1;
      return acc;
    },
    { total: 0, new: 0, duplicate: 0, invalid: 0 },
  );

  return { rows, counts };
}
