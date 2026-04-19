import { NextResponse } from "next/server";

/**
 * Endpoint ligero para `navigator.sendBeacon` desde el cliente.
 * No autentica (es público por diseño) y no escribe a DB en MVP: solo loguea
 * en server para visibilidad en Vercel logs. Cuando conectemos una tabla
 * `analytics_events` pasa a ser persistente.
 *
 * El payload es JSON libre con al menos `event: string`.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const event = typeof body?.event === "string" ? body.event : "unknown";
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics-beacon]", event, body);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[analytics] ${event}`, JSON.stringify(body));
    }
  } catch {
    // noop
  }
  return NextResponse.json({ ok: true });
}
