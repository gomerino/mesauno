"use client";

import { useRef, useState, type FormEvent } from "react";
import styles from "./editorial.module.css";

export type EditorialRsvp = "confirmado" | "declinado" | "pendiente";
type Props = {
  invitadoId: string;
  nombre: string;
  estado: EditorialRsvp;
  restricciones: string;
  dietaryOnly?: boolean;
  showDietary?: boolean;
  demo?: boolean;
  onSaved: (estado: EditorialRsvp, restricciones: string) => void;
  onClose: () => void;
};

export function EditorialRsvpForm({ invitadoId, nombre, estado, restricciones, dietaryOnly, showDietary = true, demo, onSaved, onClose }: Props) {
  const [response, setResponse] = useState(estado);
  const [diet, setDiet] = useState(restricciones);
  const [dietChoice, setDietChoice] = useState(["", "Vegetariana", "Vegana", "Sin gluten"].includes(restricciones) ? restricciones : "Otra");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      if (!demo) {
        const result = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitadoId, rsvp_estado: response, restricciones_alimenticias: diet.trim() || null }),
        });
        const data = await result.json() as { error?: string };
        if (!result.ok) throw new Error(data.error || "No pudimos guardar tu respuesta. Intenta de nuevo.");
      }
      onSaved(response, diet.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revisa tu conexión e intenta de nuevo.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  if (done) return <><div className={styles.status} role="status">{dietaryOnly ? "Tus preferencias quedaron guardadas." : response === "confirmado" ? "¡Gracias! Tu asistencia quedó confirmada." : response === "declinado" ? "Gracias por avisarnos. Tu respuesta quedó registrada." : "Guardamos tu respuesta como pendiente."}{demo && " Solo en esta demostración."}</div><div className={styles.stack}><button type="button" className={styles.secondary} onClick={onClose}>Volver a la invitación</button></div></>;
  return <>
    <p className={styles.sub}>{demo ? "Confirma tu respuesta. Esta demostración guarda el estado únicamente en esta página." : "Puedes modificar tu respuesta cuando lo necesites."}</p>
    <form onSubmit={submit} aria-busy={busy}>
      <div className={styles.field}><span>Invitación para</span><p><strong>{nombre}</strong></p></div>
      {!dietaryOnly && <label className={styles.field}>Asistencia<select value={response} onChange={(event) => setResponse(event.target.value as EditorialRsvp)} disabled={busy}><option value="pendiente">Aún no lo tengo claro</option><option value="confirmado">Sí, asistiré</option><option value="declinado">No podré asistir</option></select></label>}
      {showDietary && <><label className={styles.field}>Preferencia alimentaria (opcional)<select value={dietChoice} onChange={(event) => { const next = event.target.value; setDietChoice(next); if (next !== "Otra") setDiet(next); }} disabled={busy}><option value="">Sin preferencias</option><option value="Vegetariana">Vegetariana</option><option value="Vegana">Vegana</option><option value="Sin gluten">Sin gluten</option><option value="Otra">Otra (especificar)</option></select></label>
      {dietChoice === "Otra" && <label className={styles.field}>Otras preferencias<textarea value={diet} onChange={(event) => setDiet(event.target.value)} disabled={busy} placeholder="Cuéntanos tus alergias o preferencias…" /></label>}
      </>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Guardando…" : dietaryOnly ? "Guardar preferencias" : "Guardar mi respuesta"}</button>
    </form>
  </>;
}
