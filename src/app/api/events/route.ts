import { createStrictServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  partner1_name?: string;
  partner2_name?: string;
  event_date?: string;
};

function randomFlightCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const partner1_name = String(body.partner1_name ?? "").trim();
  const partner2_name = String(body.partner2_name ?? "").trim();
  const event_date = String(body.event_date ?? "").trim();

  if (!email || !partner1_name || !partner2_name || !event_date) {
    return NextResponse.json(
      { error: "Faltan email, nombres de ambos novios o fecha." },
      { status: 400 }
    );
  }

  const display = `${partner1_name} & ${partner2_name}`;
  const supabase = await createStrictServiceClient();

  if (!supabase) {
    const id = randomUUID();
    return NextResponse.json({
      id,
      persisted: false,
      message: "Modo local: configura SUPABASE_SERVICE_ROLE_KEY para guardar en servidor.",
    });
  }

  const { data, error } = await supabase
    .from("eventos")
    .insert({
      nombre_novio_1: partner1_name,
      nombre_novio_2: partner2_name,
      fecha_boda: event_date,
      fecha_evento: event_date,
      nombre_evento: `Boda ${display}`,
      destino: "Destino por confirmar",
      codigo_vuelo: randomFlightCode(),
      hora_embarque: "17:30",
      puerta: "B",
      asiento_default: "12A",
      lugar_evento_linea: "Lugar por confirmar",
      plan_status: "trial",
      recordatorios_activos: false,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[api/events POST]", error);
    const id = randomUUID();
    return NextResponse.json({
      id,
      persisted: false,
      message: "No se pudo guardar en servidor; continuá en modo local.",
    });
  }

  return NextResponse.json({ id: data.id as string, persisted: true });
}
