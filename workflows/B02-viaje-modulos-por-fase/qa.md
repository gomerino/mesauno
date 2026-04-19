# QA — B02 (plan borrador)

## B02-01 / B02-02 — Invitaciones check-in

| ID | Caso |
|----|------|
| Q-B02-01 | Usuario sin permiso no ve acciones de envío masivo. |
| Q-B02-02 | Bulk con 0 invitados elegibles muestra mensaje claro. |
| Q-B02-03 | Fallo parcial Resend: lista de errores sin filtrar PII en logs cliente. |
| Q-B02-04 | WhatsApp abre `wa.me` con mensaje UTF-8 correcto (acentos). |

## B02-03 — Spotify

| ID | Caso |
|----|------|
| Q-B02-10 | Token expirado: flujo reconectar sin loop infinito. |
| Q-B02-11 | Desconectar revoca estado en UI y DB coherente. |
| Q-B02-12 | Búsqueda sin resultados: empty state accesible. |

## B02-04 — Programa en vuelo

| ID | Caso |
|----|------|
| Q-B02-20 | Fotos sin EXIF caen en regla de subida o manual según spec. |
| Q-B02-21 | Zona horaria evento consistente con horas del programa. |

## Seguridad

- IDOR en fotos/programa: solo miembros del evento.
- OAuth state/cookie: validación CSRF en callbacks existentes.
