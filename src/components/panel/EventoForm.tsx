"use client";

import type { Evento } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const label = "block text-xs font-medium text-slate-400";
const input =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-teal-500 focus:ring-2";

const card = "rounded-xl border border-white/10 bg-black/20 p-4";

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
  const [fecha_principal, setFechaPrincipal] = useState(
    fechaInput(initial?.fecha_evento) || fechaInput(initial?.fecha_boda)
  );
  const [nombre_evento, setNombreEvento] = useState(initial?.nombre_evento ?? "Boda Dreams");
  const [destino, setDestino] = useState(initial?.destino ?? "");
  const [lugar_evento_linea, setLugarLinea] = useState(initial?.lugar_evento_linea ?? "");
  const [codigo_vuelo, setCodigo] = useState(initial?.codigo_vuelo ?? "");
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
      fecha_boda: fecha_principal.trim() || null,
      nombre_evento: nombre_evento.trim() || null,
      fecha_evento: fecha_principal.trim() || null,
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

    const { error } = await supabase.from("eventos").insert(row);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className={card} aria-labelledby="evento-basics-heading">
        <h2 id="evento-basics-heading" className="font-display text-base font-semibold text-white">
          Información básica
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Nombre 1</label>
            <input className={input} value={nombre_novio_1} onChange={(e) => setN1(e.target.value)} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={label}>Nombre 2</label>
            <input className={input} value={nombre_novio_2} onChange={(e) => setN2(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={label}>Nombre del evento</label>
            <input className={input} value={nombre_evento} onChange={(e) => setNombreEvento(e.target.value)} />
          </div>
          <div>
            <label className={label}>Fecha</label>
            <input
              className={input}
              type="date"
              value={fecha_principal}
              onChange={(e) => setFechaPrincipal(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Hora</label>
            <input className={input} value={hora_embarque} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
      </section>

      <section className={card} aria-labelledby="evento-location-heading">
        <h2 id="evento-location-heading" className="font-display text-base font-semibold text-white">
          Ubicación
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className={label}>Dirección</label>
            <input
              className={input}
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Calle, ciudad o referencia"
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Nombre del lugar</label>
            <input
              className={input}
              value={lugar_evento_linea}
              onChange={(e) => setLugarLinea(e.target.value)}
              placeholder="Opcional · ej. centro de eventos"
            />
          </div>
        </div>
      </section>

      <section className={card} aria-labelledby="evento-message-heading">
        <h2 id="evento-message-heading" className="font-display text-base font-semibold text-white">
          Mensaje
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className={label}>Mensaje a invitados</label>
            <textarea
              name="motivo_viaje"
              rows={4}
              value={motivo_viaje}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Una línea o un párrafo corto para la invitación."
              className={`${input} min-h-[88px] resize-y`}
            />
          </div>
        </div>
      </section>

      <details className={`${card} group`}>
        <summary className="cursor-pointer list-none font-display text-base font-semibold text-white [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            Detalles opcionales
            <span className="text-xs font-normal text-slate-500">pase · opcional</span>
          </span>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Código vuelo</label>
            <input className={input} value={codigo_vuelo} onChange={(e) => setCodigo(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className={label}>Asiento</label>
            <input className={input} value={asiento_default} onChange={(e) => setAsiento(e.target.value)} placeholder="—" />
          </div>
          <div className="col-span-2">
            <label className={label}>Puerta</label>
            <input className={input} value={puerta} onChange={(e) => setPuerta(e.target.value)} placeholder="—" />
          </div>
        </div>
      </details>

      {err ? <p className="rounded-lg bg-orange-500/20 px-3 py-2 text-sm text-orange-200">{err}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 inline-flex rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
