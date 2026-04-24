-- Configuración del boarding pass en eventos (cabecera, ruta, detalle, mapa).
-- Idempotente: add column if not exist + comentarios actualizados.
-- Alineado con: SoftAviationTicket, EventoForm, mergeEventoParaPase / addressForMapFromPass.
--
-- Resumen de producto (post 2025):
-- - Ruta C&G / Boda (branding) o origen+destino libres (cabecera) — columnas *historically* IATA, texto libre.
-- - Mapa y QR: solo `direccion_evento_completa` (no el campo corto `destino`).
-- - En el grid del pase, la celda etiquetada "DESTINO" muestra asiento: invitado o `asiento_default`.
-- - `puerta`: legacy; la UI de panel ya no edita; puede quedar null.

alter table public.eventos add column if not exists boarding_linea_aerea text;
alter table public.eventos add column if not exists boarding_tagline text;
alter table public.eventos add column if not exists boarding_logo_url text;
alter table public.eventos add column if not exists boarding_emblema_url text;
alter table public.eventos add column if not exists boarding_origen_iata text;
alter table public.eventos add column if not exists boarding_destino_iata text;
alter table public.eventos add column if not exists dress_code text;
alter table public.eventos add column if not exists direccion_evento_completa text;
alter table public.eventos add column if not exists grupo_embarque_default text;

comment on column public.eventos.boarding_linea_aerea is 'Marca "aerolínea" en la cabecera del pase (ej. DREAMS AIRLINES).';
comment on column public.eventos.boarding_tagline is 'Lema bajo el nombre de línea en la cabecera.';
comment on column public.eventos.boarding_logo_url is 'URL o ruta pública del logo (cabecera).';
comment on column public.eventos.boarding_emblema_url is 'URL o ruta de emblema u icono en cabecera.';
-- Nombres de columna históricos; hoy almacenan texto libre (ciudad, frase o código) para ruta a izquierda y derecha del avión.
comment on column public.eventos.boarding_origen_iata is 'Texto de origen (antes del avión) en la cabecera. No restringido a 3 letras IATA.';
comment on column public.eventos.boarding_destino_iata is 'Texto de destino (después del avión) en la cabecera. No restringido a 3 letras IATA.';
comment on column public.eventos.dress_code is 'Etiqueta de dress code en el cuerpo del pase (ej. Elegante).';
comment on column public.eventos.direccion_evento_completa is 'Dirección para mapa, itinerario y QR. Es la única dirección larga usada para “cómo llegar”; el campo `destino` no alimenta el mapa en flujo evento.';
comment on column public.eventos.grupo_embarque_default is 'Texto de grupo (ej. Familia) en el grid del pase; si aplica, complementa o sustituye heurística por asiento.';

-- Columnas del modelo base de eventos usadas en el pase (ya existen en `eventos`; comentario documenta el uso actual).
comment on column public.eventos.asiento_default is 'Asiento de plantilla para el pase: se muestra en la columna "DESTINO" del detalle de embarque si el invitado no tiene asiento propio. Puede ser multilínea según el cliente.';
comment on column public.eventos.puerta is 'Deprecated en UI: ya no se muestra en el boarding. Legacy / compat; puede ser null.';
