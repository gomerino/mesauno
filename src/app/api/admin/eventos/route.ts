import { getAdminSessionUser } from "@/lib/admin-auth";
import { getCanonicalSiteOriginFromEnv, getPublicOriginFromRequest } from "@/lib/public-origin";
import { createStrictServiceClient } from "@/lib/supabase/server";
import type { Evento } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const MSG_SERVICE_ROLE =
  "Configura SUPABASE_SERVICE_ROLE_KEY en el servidor (Supabase → Project Settings → API → service_role). Sin esa clave no se puede usar la API de administración de usuarios.";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string) {
  return UUID_RE.test(s.trim());
}

async function findUserIdByEmail(service: SupabaseClient, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  let page = 1;
  const perPage = 200;
  const maxPages = 500;

  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const list = data.users ?? [];
    for (const u of list) {
      if (u.email?.toLowerCase() === target) return u.id;
      const fromIdentity = u.identities?.some(
        (id) => String(id.identity_data?.email ?? "").toLowerCase() === target
      );
      if (fromIdentity) return u.id;
    }

    if (list.length < perPage) break;
    page += 1;
  }

  return null;
}

async function resolvePartnerUserId(
  service: SupabaseClient,
  email: string,
  opts: { inviteIfMissing: boolean; redirectTo: string }
): Promise<string> {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error("EMPTY_EMAIL");
  }

  const existing = await findUserIdByEmail(service, trimmed);
  if (existing) return existing;

  if (!opts.inviteIfMissing) {
    throw new Error("USER_NOT_FOUND");
  }

  const { data, error } = await service.auth.admin.inviteUserByEmail(trimmed, {
    redirectTo: opts.redirectTo,
  });

  if (error) {
    const again = await findUserIdByEmail(service, trimmed);
    if (again) return again;
    throw error;
  }

  const id = data.user?.id;
  if (!id) {
    throw new Error("INVITE_NO_USER");
  }
  return id;
}

type ListRow = Evento & { miembros_emails: string[] };

export async function GET() {
  const admin = await getAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const service = await createStrictServiceClient();
  if (!service) {
    return NextResponse.json({ error: MSG_SERVICE_ROLE }, { status: 503 });
  }

  const db = service as SupabaseClient<any>;
  const { data: eventos, error } = await db.from("eventos").select("*").order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = eventos ?? [];
  const withMembers: ListRow[] = await Promise.all(
    rows.map(async (ev: Evento) => {
      const emails: string[] = [];
      const { data: mems } = await db
        .from("evento_miembros")
        .select("user_id, rol")
        .eq("evento_id", ev.id)
        .order("created_at", { ascending: true });
      for (const m of mems ?? []) {
        const { data: u } = await service.auth.admin.getUserById(m.user_id);
        emails.push(u?.user?.email ?? m.user_id);
      }
      return { ...(ev as Evento), miembros_emails: emails };
    })
  );

  return NextResponse.json({ eventos: withMembers });
}

type PostBody = {
  eventoId?: string;
  /** N emails de gestores (primer cuenta = rol admin en el evento, resto editor). */
  gestores_emails?: string[];
  /** Al editar: añade cuentas adicionales al evento (no quita las existentes). */
  add_gestores_emails?: string[];
  email?: string;
  userId?: string;
  /** @deprecated Usar gestores_emails; se sigue aceptando por compatibilidad. */
  email_novio_1?: string;
  email_novio_2?: string;
  invitar_cuentas_nuevas?: boolean;
  nombre_novio_1?: string | null;
  nombre_novio_2?: string | null;
  fecha_boda?: string | null;
};

/** Emails únicos (por dominio case-insensitive), orden conservado. */
function dedupeEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of emails) {
    const t = String(raw ?? "").trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function gestoresListFromBody(body: PostBody): string[] | null {
  if (Array.isArray(body.gestores_emails) && body.gestores_emails.length > 0) {
    const d = dedupeEmails(body.gestores_emails.map((e) => String(e)));
    return d.length > 0 ? d : null;
  }
  const e1 = body.email_novio_1?.trim() ?? "";
  const e2 = body.email_novio_2?.trim() ?? "";
  if (e1 && e2) return dedupeEmails([e1, e2]);
  return null;
}

export async function POST(request: Request) {
  const admin = await getAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const service = await createStrictServiceClient();
  if (!service) {
    return NextResponse.json({ error: MSG_SERVICE_ROLE }, { status: 503 });
  }

  const db = service as SupabaseClient<any>;

  const n1 = body.nombre_novio_1?.trim() || null;
  const n2 = body.nombre_novio_2?.trim() || null;
  const fecha = body.fecha_boda?.trim() || null;

  const origin = getCanonicalSiteOriginFromEnv() ?? getPublicOriginFromRequest(request);
  const redirectTo = `${origin}/login`;
  const invitar = body.invitar_cuentas_nuevas !== false;

  if (body.eventoId) {
    const { data: existing, error: exErr } = await db.from("eventos").select("id").eq("id", body.eventoId).maybeSingle();
    if (exErr || !existing) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const eventoId = body.eventoId;
    const addRaw = Array.isArray(body.add_gestores_emails) ? body.add_gestores_emails : [];
    const toAdd = dedupeEmails(addRaw.map((e) => String(e)));
    if (toAdd.length > 0) {
      const { data: existingM, error: memErr } = await db.from("evento_miembros").select("user_id").eq("evento_id", eventoId);
      if (memErr) {
        return NextResponse.json({ error: memErr.message }, { status: 500 });
      }
      const existingIds = new Set((existingM ?? []).map((m: { user_id: string }) => m.user_id));
      const rowsToInsert: { evento_id: string; user_id: string; rol: string }[] = [];
      try {
        for (const em of toAdd) {
          const uid = await resolvePartnerUserId(service, em, { inviteIfMissing: invitar, redirectTo });
          if (existingIds.has(uid)) continue;
          existingIds.add(uid);
          rowsToInsert.push({ evento_id: eventoId, user_id: uid, rol: "editor" });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "USER_NOT_FOUND") {
          return NextResponse.json(
            {
              error:
                "Un email no tiene cuenta aún. Activa «Invitar por correo» o crea el usuario en Authentication.",
            },
            { status: 400 }
          );
        }
        if (msg === "EMPTY_EMAIL") {
          return NextResponse.json({ error: "Email inválido." }, { status: 400 });
        }
        const raw = e instanceof Error ? e.message : "Error al invitar usuarios";
        const out =
          raw.includes("Bearer") || raw.includes("JWT") ? `${MSG_SERVICE_ROLE} (${raw})` : raw;
        return NextResponse.json({ error: out }, { status: 500 });
      }
      if (rowsToInsert.length > 0) {
        const { error: insErr } = await db.from("evento_miembros").insert(rowsToInsert);
        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
    }

    const { data, error } = await db
      .from("eventos")
      .update({
        nombre_novio_1: n1,
        nombre_novio_2: n2,
        fecha_boda: fecha,
      })
      .eq("id", eventoId)
      .select("*")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, evento: data });
  }

  const eventoBase = {
    nombre_novio_1: n1,
    nombre_novio_2: n2,
    fecha_boda: fecha,
  };

  async function insertEventoWithMiembros(userIds: string[], roles: ("admin" | "editor")[]) {
    const { data: ev, error: insErr } = await db.from("eventos").insert(eventoBase).select("*").single();
    if (insErr || !ev) {
      return { error: insErr?.message ?? "No se pudo crear el evento" };
    }
    const rows = userIds.map((uid, i) => ({
      evento_id: ev.id,
      user_id: uid,
      rol: roles[i] ?? "editor",
    }));
    const { error: mErr } = await db.from("evento_miembros").insert(rows);
    if (mErr) {
      return { error: mErr.message };
    }
    return { evento: ev as Evento };
  }

  const gestores = gestoresListFromBody(body);

  if (gestores && gestores.length >= 1) {
    const userIds: string[] = [];
    const seenUid = new Set<string>();
    try {
      for (const em of gestores) {
        const uid = await resolvePartnerUserId(service, em, { inviteIfMissing: invitar, redirectTo });
        if (seenUid.has(uid)) {
          return NextResponse.json(
            { error: `El email «${em}» corresponde a un usuario ya incluido en la lista.` },
            { status: 400 }
          );
        }
        seenUid.add(uid);
        userIds.push(uid);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "USER_NOT_FOUND") {
        return NextResponse.json(
          {
            error:
              "Algún email no tiene cuenta aún. Activa «Invitar por correo» o crea el usuario en Authentication.",
          },
          { status: 400 }
        );
      }
      if (msg === "EMPTY_EMAIL") {
        return NextResponse.json({ error: "Email inválido." }, { status: 400 });
      }
      const raw = e instanceof Error ? e.message : "Error al crear o invitar usuarios";
      const out =
        raw.includes("Bearer") || raw.includes("JWT") ? `${MSG_SERVICE_ROLE} (${raw})` : raw;
      return NextResponse.json({ error: out }, { status: 500 });
    }

    const roles = userIds.map((_, i) => (i === 0 ? "admin" : "editor")) as ("admin" | "editor")[];
    const result = await insertEventoWithMiembros(userIds, roles);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    if ("evento" in result && result.evento) {
      return NextResponse.json({ ok: true, evento: result.evento });
    }
    return NextResponse.json({ error: "Error desconocido al crear evento" }, { status: 500 });
  }

  const email = body.email?.trim() ?? "";
  const userIdRaw = body.userId?.trim() ?? "";

  if (!userIdRaw && !email) {
    return NextResponse.json(
      {
        error:
          "Indica al menos un email de gestor (lista), o en opciones avanzadas un solo email o UUID de cuenta existente.",
      },
      { status: 400 }
    );
  }

  let userId: string | null = null;

  if (userIdRaw) {
    if (!isUuid(userIdRaw)) {
      return NextResponse.json({ error: "El ID de usuario no tiene formato UUID válido." }, { status: 400 });
    }
    const { data: uData, error: uErr } = await service.auth.admin.getUserById(userIdRaw);
    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }
    if (!uData.user) {
      return NextResponse.json(
        { error: "No existe ningún usuario con ese UUID en Authentication." },
        { status: 400 }
      );
    }
    userId = uData.user.id;
  } else {
    try {
      if (invitar) {
        userId = await resolvePartnerUserId(service, email, { inviteIfMissing: true, redirectTo });
      } else {
        userId = await findUserIdByEmail(service, email);
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Error al buscar usuario";
      const msg =
        raw.includes("Bearer") || raw.includes("JWT")
          ? `${MSG_SERVICE_ROLE} (${raw})`
          : raw;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "No se encontró ningún usuario con ese email. Usa los dos emails con invitación activada o regístrate primero.",
        },
        { status: 400 }
      );
    }
  }

  const result = await insertEventoWithMiembros([userId], ["admin"]);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  if ("evento" in result && result.evento) {
    return NextResponse.json({ ok: true, evento: result.evento });
  }
  return NextResponse.json({ error: "Error al crear evento" }, { status: 500 });
}
