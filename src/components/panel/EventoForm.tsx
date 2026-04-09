"use client";

import type { Evento } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const label = "block text-xs font-medium text-slate-400";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-teal-500 focus:ring-2";

type Props = {
  initial: Evento | null;
};

function fechaInput(v: string | null | undefined): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  return s.length === 10 ? s : "";
}

export function EventoForm({ initial }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [nombre_novio_1, setN1] = useState(initial?.nombre_novio_1 ?? "");
  const [nombre_novio_2, setN2] = useState(initial?.nombre_novio_2 ?? "");
  const [fecha_boda, setFechaBoda] = useState(fechaInput(initial?.fecha_boda));
  const [nombre_evento, setNombreEvento] = useState(initial?.nombre_evento ?? "Boda Dreams");
  const [fecha_evento, setFechaEvento] = useState(fechaInput(initial?.fecha_evento));
  const [destino, setDestino] = useState(initial?.destino ?? "");
  const [lugar_evento_linea, setLugarLinea] = useState(
    initial?.lugar_evento_linea ?? "Centro de eventos - La Casita de cuentos - Buin"
  );
  const [codigo_vuelo, setCodigo] = useState(initial?.codigo_vuelo ?? "MI-101");
  const [hora_embarque, setHora] = useState(initial?.hora_embarque ?? "12:00");
  const [puerta, setPuerta] = useState(initial?.puerta ?? "");
  const [asiento_default, setAsiento] = useState(initial?.asiento_default ?? "");
  const [motivo_viaje, setMotivo] = useState(initial?.motivo_viaje ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const row = {
      nombre_novio_1: nombre_novio_1.trim() || null,
      nombre_novio_2: nombre_novio_2.trim() || null,
      fecha_boda: fecha_boda.trim() || null,
      nombre_evento: nombre_evento.trim() || null,
      fecha_evento: fecha_evento.trim() || null,
      destino: destino.trim() || null,
      lugar_evento_linea: lugar_evento_linea.trim() || null,
      codigo_vuelo: codigo_vuelo.trim() || null,
      hora_embarque: hora_embarque.trim() || null,
      puerta: puerta.trim() || null,
      asiento_default: asiento_default.trim() || null,
      motivo_viaje: motivo_viaje.trim() || null,
    };

    if (initial?.id) {
      const { error } = await supabase.from("eventos").update(row).eq("id", initial.id);
      setSaving(false);
      if (error) {
        setErr(error.message);
        return;
      }
      router.refresh();
      return;
    }

    // No usar .select() aquí: en PG el RETURNING corre antes que los triggers AFTER INSERT,
    // así que aún no existe la fila en evento_miembros y la política SELECT de eventos falla (RLS).
    const { error } = await supabase.from("eventos").insert(row);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-10">
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-white">Novios / organizadores</h2>
        <p className="text-sm text-slate-400">
          Datos que salen en el pie del boarding pass. Otros gestores del mismo evento se añaden desde administración.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Nombre 1</label>
            <input className={input} value={nombre_novio_1} onChange={(e) => setN1(e.target.value)} />
          </div>
          <div>
            <label className={label}>Nombre 2</label>
            <input className={input} value={nombre_novio_2} onChange={(e) => setN2(e.target.value)} />
          </div>
          <div>
            <label className={label}>Fecha de la boda</label>
            <input
              className={input}
              type="date"
              value={fecha_boda}
              onChange={(e) => setFechaBoda(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-white">Evento y boarding pass</h2>
        <p className="text-sm text-slate-400">
          Válido para todas las invitaciones. El QR del mapa usa la dirección de destino.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Nombre del evento</label>
            <input className={input} value={nombre_evento} onChange={(e) => setNombreEvento(e.target.value)} />
          </div>
          <div>
            <label className={label}>Fecha del evento</label>
            <input
              className={input}
              type="date"
              value={fecha_evento}
              onChange={(e) => setFechaEvento(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Destino (dirección o texto para mapas)</label>
            <input
              className={input}
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ej: dirección completa o nombre del lugar"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Línea corta en el pase (bajo el logo)</label>
            <input
              className={input}
              value={lugar_evento_linea}
              onChange={(e) => setLugarLinea(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Código de vuelo</label>
            <input className={input} value={codigo_vuelo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          <div>
            <label className={label}>Hora de embarque</label>
            <input className={input} value={hora_embarque} onChange={(e) => setHora(e.target.value)} />
          </div>
          <div>
            <label className={label}>Puerta</label>
            <input className={input} value={puerta} onChange={(e) => setPuerta(e.target.value)} />
          </div>
          <div>
            <label className={label}>Asiento (por defecto para todos)</label>
            <input className={input} value={asiento_default} onChange={(e) => setAsiento(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-white">Motivo del viaje</h2>
        <p className="text-sm text-slate-400">
          Texto que verán los invitados en la invitación, encima del RSVP.
        </p>
        <textarea
          name="motivo_viaje"
          rows={4}
          value={motivo_viaje}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: ¡Nos casamos! Ven a celebrar con nosotros…"
          className={`${input} min-h-[100px] resize-y`}
        />
      </section>

      {err && (
        <p className="rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">{err}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-teal-500 px-8 py-3 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar evento"}
      </button>
    </form>
  );
}
