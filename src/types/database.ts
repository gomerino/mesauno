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
  /** Plan de producto contratado en checkout (esencial / experiencia). */
  plan?: "esencial" | "experiencia" | null;
  /** Sesión de Checkout Pro que originó el evento (idempotencia). */
  checkout_session_id?: string | null;
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
  /** Tema visual de las invitaciones (`themes.id`). Se propaga a todos los invitados del evento. */
  theme_id?: string | null;
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
  /** Tema visual de la landing `/invitacion/*` (`themes.id`). */
  theme_id?: string | null;
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

/** @deprecated Reemplazada por `Provider` + `ProviderService` (M01). Se mantiene temporalmente durante transición. */
export type MarketplaceServicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  precio_desde: number | null;
  imagen_url: string | null;
  proveedor: string | null;
};

// ─── Marketplace proveedores (M01 — workflows/M01-providers-schema) ────────
//
// Convención: nombres de tabla/columna en español (patrón del resto del
// schema). Enum values en español cuando es natural (`pendiente/aprobado`,
// `imagen/video`, `en_app/email/whatsapp`); términos comerciales (`free`,
// `premium`) y códigos compactos (`lt-500k`) quedan en inglés.

export type ProveedorEstado = "pendiente" | "aprobado" | "suspendido";
export type ProveedorPlan = "free" | "premium";

/**
 * Categorías canónicas del marketplace. La columna DB es `text` (no enum) para
 * permitir agregar categorías sin migración, pero el app layer debe usar este
 * set como fuente de verdad para filtros y badges.
 */
export type ProveedorCategoria =
  | "fotografia"
  | "video"
  | "catering"
  | "musica"
  | "lugar"
  | "decoracion"
  | "flores"
  | "coordinacion";

export type Proveedor = {
  id: string;
  user_id: string;
  slug: string;
  nombre_negocio: string;
  eslogan: string | null;
  biografia: string | null;
  region: string;
  ciudad: string | null;
  categoria_principal: ProveedorCategoria;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  instagram: string | null;
  /** Formato E.164 (ej. `+56912345678`). Validar en la capa API. */
  whatsapp: string | null;
  estado: ProveedorEstado;
  /** Motivo (código) cuando estado pasa a suspendido. */
  motivo_suspension: string | null;
  plan: ProveedorPlan;
  plan_inicio_at: string | null;
  /** Contador reseteado mensualmente por job externo (no es count de la tabla). */
  solicitudes_mes: number;
  created_at: string;
  updated_at: string;
};

export type ProveedorServicio = {
  id: string;
  proveedor_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: ProveedorCategoria;
  precio_desde_clp: number | null;
  duracion_min: number | null;
  activo: boolean;
  orden: number;
  created_at: string;
};

export type ProveedorMedio = {
  id: string;
  proveedor_id: string;
  servicio_id: string | null;
  tipo: "imagen" | "video";
  /** Path relativo al bucket `proveedor-medios` (ej. `<proveedor_id>/<uuid>.webp`). */
  storage_path: string;
  /** URL pública (bucket es read-public). */
  url_publica: string;
  alt: string | null;
  orden: number;
  created_at: string;
};

export type ProveedorSolicitudCanal = "whatsapp" | "email" | "en_app";
export type ProveedorSolicitudRangoPresupuesto = "lt-500k" | "500k-1m" | "1m-3m" | "gt-3m";

export type ProveedorSolicitud = {
  id: string;
  proveedor_id: string;
  evento_id: string | null;
  remitente_user_id: string | null;
  canal: ProveedorSolicitudCanal;
  mensaje: string | null;
  /** ISO YYYY-MM-DD de la fecha del evento (si se conoce). */
  fecha_evento_contexto: string | null;
  region_contexto: string | null;
  presupuesto_clp_contexto: number | null;
  rango_presupuesto: ProveedorSolicitudRangoPresupuesto | null;
  /**
   * `true` si al momento del insert el proveedor estaba free y ya tenía
   * `solicitudes_mes >= cap`. El proveedor NO recibe email cuando está limitado.
   */
  limitado_por_plan: boolean;
  /** Día UTC para `UNIQUE(proveedor_id, remitente_user_id, canal, dia_solicitud)`. */
  dia_solicitud: string;
  created_at: string;
};

export type ProveedorFavorito = {
  id: string;
  evento_id: string;
  proveedor_id: string;
  servicio_id: string | null;
  agregado_por: string;
  nota: string | null;
  created_at: string;
};

/**
 * Fila de la vista `v_marketplace_tarjetas` consumida por `/marketplace`.
 * Solo contiene proveedores con `estado = 'aprobado'`.
 */
export type MarketplaceTarjeta = {
  id: string;
  slug: string;
  nombre_negocio: string;
  eslogan: string | null;
  categoria_principal: ProveedorCategoria;
  region: string;
  ciudad: string | null;
  plan: ProveedorPlan;
  estado: ProveedorEstado;
  created_at: string;
  solicitudes_mes: number;
  imagen_hero_url: string | null;
  precio_desde_clp: number | null;
  medios_count: number;
};
