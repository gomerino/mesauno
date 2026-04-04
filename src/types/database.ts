/** Novios + configuración global del evento (un registro por usuario). */
export type Pareja = {
  id: string;
  user_id: string;
  nombre_novio_1: string | null;
  nombre_novio_2: string | null;
  fecha_boda: string | null;
  nombre_evento: string | null;
  fecha_evento: string | null;
  destino: string | null;
  codigo_vuelo: string | null;
  hora_embarque: string | null;
  puerta: string | null;
  /** Asiento por defecto en el pase (mismo para todos los invitados). */
  asiento_default: string | null;
  motivo_viaje: string | null;
  /** Línea corta bajo el encabezado del boarding pass (lugar). */
  lugar_evento_linea: string | null;
  created_at?: string | null;
};

export type InvitadoAcompanante = {
  id: string;
  invitado_id: string;
  nombre: string;
  orden?: number | null;
  created_at?: string | null;
};

export type Invitado = {
  id: string;
  nombre_pasajero: string;
  /** @deprecated Preferir `invitado_acompanantes` (varios). Migración SQL copia a la tabla. */
  nombre_acompanante?: string | null;
  /** Acompañantes en el mismo pase (tabla hija; no es la tabla `parejas` de los novios). */
  invitado_acompanantes?: InvitadoAcompanante[] | null;
  email: string | null;
  telefono: string | null;
  /** En BD suele ser text[]; la UI usa texto separado por comas. */
  restricciones_alimenticias: string | string[] | null;
  rsvp_estado: "pendiente" | "confirmado" | "declinado" | null;
  codigo_vuelo: string | null;
  asiento: string | null;
  puerta: string | null;
  hora_embarque: string | null;
  destino: string | null;
  nombre_evento: string | null;
  fecha_evento: string | null;
  /** Texto del panel (motivo del viaje), mismo valor en todos los invitados de la pareja. */
  motivo_viaje: string | null;
  pareja_id: string | null;
  /** Usuario que creó el invitado cuando aún no hay pareja (RLS). */
  owner_user_id?: string | null;
  created_at?: string | null;
};

export type AporteRegalo = {
  id: string;
  pareja_id: string;
  invitado_id: string | null;
  monto: number;
  concepto: string | null;
  created_at?: string | null;
};

export type MarketplaceServicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  precio_desde: number | null;
  imagen_url: string | null;
  proveedor: string | null;
};
