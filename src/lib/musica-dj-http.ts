import { createClient, createServiceClient } from "@/lib/supabase/server";
import { musicaDjResolverAcceso, type MusicaDjNivelAcceso } from "@/lib/musica-modo-dj";

export async function musicaDjJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function musicaDjRequireAcceso(
  request: Request,
  eventoId: string,
  nivelMinimo: "dj_token" | "admin",
  body?: Record<string, unknown>
): Promise<{ ok: true; nivel: MusicaDjNivelAcceso } | { ok: false; status: number; message: string }> {
  const b = body ?? (await musicaDjJsonBody(request));
  const dj_acceso = typeof b.dj_acceso === "string" ? b.dj_acceso : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = await createServiceClient();
  const nivel = await musicaDjResolverAcceso(db, eventoId, {
    userId: user?.id ?? null,
    dj_token: dj_acceso,
  });

  if (!nivel) {
    return {
      ok: false,
      status: 403,
      message:
        nivelMinimo === "admin"
          ? "Inicia sesión como administrador del evento."
          : "Acceso no válido: revisá tu sesión o el token DJ.",
    };
  }
  if (nivelMinimo === "admin" && nivel !== "admin") {
    return { ok: false, status: 403, message: "Solo administradores del evento." };
  }
  return { ok: true, nivel };
}
