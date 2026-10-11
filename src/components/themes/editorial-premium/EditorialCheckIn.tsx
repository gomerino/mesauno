"use client";

import { Component, Suspense, lazy, useState, type ReactNode } from "react";
import { EditorialDialog } from "./EditorialDialog";
import styles from "./editorial.module.css";

const CheckInQr = lazy(() => import("@/components/InvitacionCheckInQr").then(module => ({ default: module.InvitacionCheckInQr })));

class QrBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">No pudimos mostrar el QR. Vuelve a cargar la página para intentarlo de nuevo.</p> : this.props.children; }
}

export function EditorialCheckIn({ payload, passengers, demo }: { payload?: string; passengers: string[]; demo: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const available = Boolean(payload?.trim());
  const qr = (size: number, compact = false) => <QrBoundary><Suspense fallback={<p role="status">Cargando tu QR…</p>}><CheckInQr payload={payload!} size={size} presentation={compact ? "compact" : "default"} /></Suspense></QrBoundary>;
  return <section className={styles.checkIn} aria-label="Tu ingreso al evento">
    <h2>Tu ingreso al evento</h2>
    <ul>{passengers.map((name, index) => <li key={index}>{name}</li>)}</ul>
    {available ? <>{qr(144, true)}<button type="button" className={styles.secondary} onClick={() => setExpanded(true)}>Ampliar QR</button></> : <p role="status">{demo ? "El QR se muestra en la invitación real cuando está disponible." : "Tu código de ingreso aún no está disponible."}</p>}
    {expanded && <EditorialDialog title="Tu QR de ingreso" onClose={() => setExpanded(false)}>{qr(240)}</EditorialDialog>}
  </section>;
}
