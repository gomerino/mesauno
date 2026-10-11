import { CalendarDays, Clock3, MapPin, Plane, ChevronRight, Check } from "lucide-react";
import styles from "./editorial-details.module.css";

type Props = {
  date: string; passDate: string; time: string; venue: string; mapUrl: string;
  passengers: string[]; state: "confirmado" | "declinado" | "pendiente";
  airline: string; showPass: boolean;
};

export function EditorialEventDetails({ date, passDate, time, venue, mapUrl, passengers, state, airline, showPass }: Props) {
  // Solo se separa una localidad explícita del campo corto; nunca se deduce desde la dirección postal.
  const parts = venue.split(/\s+[·–—-]\s+/);
  const locality = parts.length > 1 ? parts.pop() : undefined;
  const venueName = parts.join(" · ");
  const [weekday, ...dateParts] = date.split(", ");
  const label = state === "confirmado" ? "Confirmado" : state === "declinado" ? "No asistiré" : "Pendiente";
  return <section className={styles.details} aria-label="Fecha, hora y ubicación" data-testid="editorial-details">
    <div className={styles.facts}>
      <div><CalendarDays aria-hidden="true" /><span className={styles.srOnly}>Fecha</span><strong className={styles.weekday}>{weekday}</strong>{dateParts.length > 0 && <span className={styles.date}>{dateParts.join(", ")}</span>}</div>
      <div><Clock3 aria-hidden="true" /><span className={styles.srOnly}>Hora</span><strong>{time} h</strong></div>
      <div id="editorial-place"><MapPin aria-hidden="true" /><span className={styles.srOnly}>Lugar</span><strong>{venueName}</strong>{locality && <span>{locality}</span>}</div>
    </div>
    {mapUrl && <a className={styles.directions} href={mapUrl} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden="true" size={20} />Cómo llegar<ChevronRight aria-hidden="true" size={18} /></a>}
    {showPass && <section className={styles.pass} aria-label="Pase de embarque">
      <div className={styles.passBody}>
        <div className={styles.brand}><Plane aria-hidden="true" size={22} />{airline} · INVITACIÓN</div>
        <h2>Un destino: juntos</h2>
        <div className={styles.passFields}>
          <div><span className={styles.label}>Pasajeros</span><div className={styles.passengers}>{passengers.map((name, i) => <span key={i}>{name}</span>)}</div></div>
          <div><span className={styles.label}>Estado</span><strong className={state === "confirmado" ? styles.confirmed : styles.state}>{label}{state === "confirmado" && <Check size={15} aria-hidden="true" />}</strong></div>
        </div>
        <div className={styles.route}><div><span className={styles.label}>Fecha</span><strong>{passDate}</strong></div><div><span className={styles.label}>Destino</span><strong>{venueName}</strong>{locality && <span>{locality}</span>}</div></div>
      </div>
    </section>}
  </section>;
}
