import type { SupabaseClient } from "@supabase/supabase-js";
import { asegurarSlugUnico } from "./slug";
import { esCategoriaProveedor } from "./constants";
import type { Proveedor, ProveedorCategoria } from "@/types/database";

/**
 * Flujo de registro self-serve de un proveedor (M02 JUR-37).
 *
 * Responsabilidades:
 * - Validar inputs mínimos.
 * - Asegurar slug único.
 * - Crear (o reusar) `auth.users` con `createServiceRoleClient`.
 * - Insertar row en `proveedores` (estado=`pendiente`, plan=`free`).
 * - Devolver info mínima para el flujo de UI.
 *
 * NO envía emails. El caller (API route) decide qué emails disparar.
 */

export type RegistroProveedorInput = {
  email: string;
  password: string;
  nombreNegocio: string;
  categoriaPrincipal: string; // Se valida contra `ProveedorCategoria`.
  region: string;
  ciudad?: string | null;
  eslogan?: string | null;
  biografia?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  sitioWeb?: string | null;
  telefono?: string | null;
};

export type RegistroProveedorErrorCode =
  | "input-invalido"
  | "email-invalido"
  | "password-debil"
  | "categoria-invalida"
  | "region-vacia"
  | "nombre-vacio"
  | "email-en-uso-otro-proveedor"
  | "error-auth"
  | "error-db";

export class RegistroProveedorError extends Error {
  constructor(
    public readonly code: RegistroProveedorErrorCode,
    message: string,
    public readonly detalle?: string,
  ) {
    super(message);
    this.name = "RegistroProveedorError";
  }
}

export type RegistroProveedorResult = {
  proveedor: Proveedor;
  userId: string;
  /** True si creamos un nuevo auth.users; false si reusamos uno existente (novio que pasa a proveedor). */
  creoUsuarioNuevo: boolean;
};

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarPassword(pwd: string): boolean {
  // Política mínima: 8+ chars. Supabase rechaza < 6 por default; el cliente UX recomienda 8+.
  return typeof pwd === "string" && pwd.length >= 8;
}

function validarInstagram(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().replace(/^@/, "");
  if (trimmed.length === 0) return null;
  // Solo letras, números, puntos, guiones bajos.
  if (!/^[A-Za-z0-9._]{1,30}$/.test(trimmed)) return null;
  return trimmed;
}

function validarE164(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().replace(/\s+/g, "");
  if (trimmed.length === 0) return null;
  if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Ejecuta el registro con un cliente admin (service role). Usar desde una
 * route handler. NO devuelve nada secreto — el caller luego debe loguear al
 * user vía el cliente SSR estándar con la misma password.
 *
 * @param admin Cliente Supabase con service role (createStrictServiceClient).
 */
export async function registrarProveedor(
  admin: SupabaseClient,
  input: RegistroProveedorInput,
): Promise<RegistroProveedorResult> {
  const email = input.email?.trim().toLowerCase() ?? "";
  const nombreNegocio = input.nombreNegocio?.trim() ?? "";
  const categoria = input.categoriaPrincipal?.trim() ?? "";
  const region = input.region?.trim() ?? "";

  if (!validarEmail(email)) {
    throw new RegistroProveedorError("email-invalido", "Email inválido.");
  }
  if (!validarPassword(input.password)) {
    throw new RegistroProveedorError(
      "password-debil",
      "La contraseña debe tener al menos 8 caracteres.",
    );
  }
  if (nombreNegocio.length === 0) {
    throw new RegistroProveedorError("nombre-vacio", "Cuéntanos el nombre de tu negocio.");
  }
  if (!esCategoriaProveedor(categoria)) {
    throw new RegistroProveedorError(
      "categoria-invalida",
      "La categoría seleccionada no está soportada.",
    );
  }
  if (region.length === 0) {
    throw new RegistroProveedorError("region-vacia", "Selecciona una región.");
  }

  let userId: string;
  let creoUsuarioNuevo = true;

  // 1. Intentar crear el usuario en auth. Si ya existe, buscarlo.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { origen: "registro-proveedor" },
  });

  if (createErr) {
    const msg = (createErr.message || "").toLowerCase();
    const yaExiste =
      msg.includes("already registered") ||
      msg.includes("already been registered") ||
      msg.includes("duplicate") ||
      msg.includes("exists");

    if (!yaExiste) {
      throw new RegistroProveedorError(
        "error-auth",
        "No pudimos crear tu cuenta. Intenta nuevamente.",
        createErr.message,
      );
    }

    // Buscar user existente.
    const existing = await buscarUserIdPorEmail(admin, email);
    if (!existing) {
      throw new RegistroProveedorError(
        "error-auth",
        "El correo parece registrado pero no pudimos recuperarlo.",
        createErr.message,
      );
    }
    userId = existing;
    creoUsuarioNuevo = false;

    // Ya hay un proveedor con este user_id? (`UNIQUE user_id`)
    const { data: yaProv } = await admin
      .from("proveedores")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (yaProv) {
      throw new RegistroProveedorError(
        "email-en-uso-otro-proveedor",
        "Ya existe un perfil de proveedor con este correo. Inicia sesión para editarlo.",
      );
    }
  } else {
    if (!created?.user?.id) {
      throw new RegistroProveedorError(
        "error-auth",
        "No pudimos recuperar tu usuario tras crear la cuenta.",
      );
    }
    userId = created.user.id;
  }

  // 2. Slug único.
  const slug = await asegurarSlugUnico(nombreNegocio, async (s) => {
    const { data, error } = await admin
      .from("proveedores")
      .select("id")
      .eq("slug", s)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  });

  // 3. Insert proveedor.
  const payload = {
    user_id: userId,
    slug,
    nombre_negocio: nombreNegocio,
    eslogan: input.eslogan?.trim() || null,
    biografia: input.biografia?.trim() || null,
    region,
    ciudad: input.ciudad?.trim() || null,
    categoria_principal: categoria as ProveedorCategoria,
    telefono: input.telefono?.trim() || null,
    email,
    sitio_web: input.sitioWeb?.trim() || null,
    instagram: validarInstagram(input.instagram),
    whatsapp: validarE164(input.whatsapp),
    estado: "pendiente" as const,
    plan: "free" as const,
  };

  const { data: proveedor, error: insErr } = await admin
    .from("proveedores")
    .insert(payload)
    .select("*")
    .single();

  if (insErr || !proveedor) {
    // Compensación: si creamos user nuevo y falla el insert, borrar el user.
    if (creoUsuarioNuevo) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
    throw new RegistroProveedorError(
      "error-db",
      "No pudimos guardar tu perfil. Intentá de nuevo.",
      insErr?.message,
    );
  }

  return {
    proveedor: proveedor as Proveedor,
    userId,
    creoUsuarioNuevo,
  };
}

async function buscarUserIdPorEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  // `listUsers` pagina; para MVP usamos el filter email-like.
  // Si en el futuro hay muchos usuarios, migrar a `auth.admin.getUserByEmail` cuando esté GA.
  type AuthAdmin = {
    listUsers: (opts?: { perPage?: number }) => Promise<{
      data: { users: Array<{ id: string; email?: string | null }> } | null;
      error: Error | null;
    }>;
  };
  const authAdmin = admin.auth.admin as unknown as AuthAdmin;
  const { data, error } = await authAdmin.listUsers({ perPage: 200 });
  if (error || !data?.users) return null;
  const needle = email.toLowerCase();
  const found = data.users.find((u) => (u.email ?? "").toLowerCase() === needle);
  return found?.id ?? null;
}
