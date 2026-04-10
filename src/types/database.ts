/** Configuración global del evento (novios, fecha, boarding pass). Varios usuarios vía `evento_miembros`. */
export type Evento = {
  id: string;
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
  /** Membresía Mesa Uno (Mercado Pago). */
  plan_status?: "trial" | "paid" | "expired" | null;
  payment_id?: string | null;
  monto_pagado?: number | null;
  /** Máximo de correos de insistencia (excluye el envío inicial). */
  max_recordatorios?: number | null;
  /** Días mínimos entre insistencias. */
  frecuencia_recordatorios?: number | null;
  recordatorios_activos?: boolean | null;
  /** Primer día (inclusive) en que el cron puede enviar recordatorios. null = sin aplazamiento. */
  fecha_inicio_recordatorios?: string | null;
  created_at?: string | null;
};

export type EventoMiembro = {
  id: string;
  evento_id: string;
  user_id: string;
  rol: "admin" | "editor" | "staff_centro";
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
  motivo_viaje: string | null;
  evento_id: string | null;
  /** Usuario que creó el invitado cuando aún no hay evento vinculado (RLS). */
  owner_user_id?: string | null;
  email_enviado?: boolean | null;
  fecha_envio?: string | null;
  conteo_recordatorios?: number | null;
  ultimo_recordatorio_at?: string | null;
  invitacion_vista?: boolean | null;
  fecha_ultima_vista?: string | null;
  /** URL pública `/invitacion/[token_acceso]` sin exponer `id`. */
  token_acceso?: string | null;
  /** Hash único para check-in presencial. */
  qr_code_token?: string | null;
  asistencia_confirmada?: boolean | null;
  created_at?: string | null;
};

export type AporteRegalo = {
  id: string;
  evento_id: string;
  invitado_id: string | null;
  monto: number;
  concepto: string | null;
  created_at?: string | null;
};

export type EventoProgramaHito = {
  id: string;
  evento_id: string;
  /** HH:MM:SS desde Postgres */
  hora: string;
  titulo: string;
  descripcion_corta: string | null;
  lugar_nombre: string | null;
  ubicacion_url: string | null;
  icono: "Church" | "Beer" | "Utensils" | "Music";
  orden: number;
  created_at?: string | null;
};

/** Fila en `evento_fotos`; `storage_path` relativo al bucket `fotos_eventos`. */
export type EventoFoto = {
  id: string;
  evento_id: string;
  invitado_id: string | null;
  storage_path: string;
  created_at: string;
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
