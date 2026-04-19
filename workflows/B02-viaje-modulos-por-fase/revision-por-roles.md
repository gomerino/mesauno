# Revisión multi-rol — B02 (Jurnex)

Síntesis para **refinar** la propuesta de módulos por fase. Cada rol aporta criterios y riesgos; PM integra priorización.

---

## PM (`agents/pm.txt`)

**Priorización sugerida (ICE cualitativo):**

1. **Check-in “Invitaciones” unificada** — alto impacto en activación; medio esfuerzo si es solo IA + enlaces a flujos existentes.
2. **Despegue Spotify** — depende de alcance API; puede partir por **MVP honesto** (playlist + cola de sugerencias en DB) antes de votos en tiempo real.
3. **En vuelo programa único** — alto impacto día-D; alto riesgo técnico y de moderación; conviene **spike** antes de comprometer.

**Historias que faltan como tickets explícitos:**

- HU “Invitaciones hub” (check-in).
- HU “Spotify MVP vs Spotify completo” (despegue).
- HU “Programa interactivo v0” (en vuelo) con out of scope explícito (chat masivo, etc.).

**Edge cases PM:** usuario sin email en invitados (bulk correo inútil); WhatsApp sin número; Spotify desvinculado a mitad de evento.

---

## UX (`agents/ux.txt`)

**Check-in**

- Tres pilares visibles: **Evento · Pasajeros · Invitaciones** (evitar cuarta card “Programa” aquí si el criterio de producto es “salir a invitar primero”).
- Dentro de **Invitaciones**: sub-steps claros — (1) revisar lista (2) preview (3) correo masivo (4) WhatsApp “por invitado” con copy que **no prometa** broadcast nativo.
- **Frictions:** saltos a `/panel/invitacion`, `/invitados/vista`, `InvitadosManager` — reducir sensación de “tres productos”.

**Despegue**

- Orden sugerido: **Programa** primero, **Experiencia/Spotify** segundo; coherente con “día ya está cerca”.
- Spotify: flujo único (conectar → playlist → opcional votos) con estados vacíos explicados.

**En vuelo**

- **Un hub:** programa con timeline vertical; fotos ancladas a hitos o franjas horarias; música en el mismo contexto.
- Reacciones/mensajes: si se agregan, **límite visible** (quién modera, reporte) y modo “solo pareja” vs “invitados”.

**Mobile:** el hub en vuelo debe ser **una columna**, scroll largo aceptable si el ancla es el programa.

---

## Tech Lead (`agents/techlead.txt`)

**Estado actual (código):**

| Área | Qué hay | Brecha |
|------|---------|--------|
| Correo masivo | `runBulkInvitationSend` (Resend), modos `unsent` / `pending_rsvp` | Límites, rate, idempotencia por invitado, observabilidad |
| WhatsApp | `WhatsAppInviteButton` — enlace wa.me por invitado | **No** hay envío masivo server-side; cualquier “mass WA” implica WhatsApp Business API + plantillas + costo |
| Preview | `/panel/invitados/vista` | OK panel; regla repo: no tocar `/invitacion/*` público sin HU aparte |
| Spotify | `evento_spotify`, OAuth, `saveSpotifyPlaylistIdAction` | UI experiencia parcial; **no** hay búsqueda/votos en panel; validar scopes de Spotify para “cola de sugerencias” y escritura en playlist |
| Fotos / programa | Álbum en experiencia como concepto | **No** hay vínculo foto↔hito en schema revisado aquí; requiere modelo `foto → timestamp → hito_id` o ventana |

**Riesgos:** Spotify API rate limits; moderación de fotos/comentarios (RLS, reportes); carga en vivo (WebSockets vs polling).

**Migración:** nuevas tablas solo con RLS y `supabase/migration_*.sql` idempotentes.

---

## Dev (`agents/dev.txt`)

**Touchpoints probables si se aprueba B02:**

- `JourneyViajeClient` — nuevas `JourneyCardKey` o agrupación por fase (no solo reorder).
- `JourneyHome` / `panel-nav-config` — rutas bajo “Invitaciones”.
- `ExperienciaPageClient` / `ExperienceCard` — CTAs reales a Spotify vs placeholders.
- Servicios: `send-invitations-bulk`, posible cola `votos_canciones` o similar.

**Convención:** `camelCase` TS, `snake_case` SQL; sin duplicar lógica de invitación pública.

---

## QA (`agents/qa.txt`)

**Casos mínimos:**

- Bulk: 0 invitados, 100 invitados, email inválido, duplicados, Resend caído.
- WhatsApp: sin teléfono, número malformado, mensaje UTF-8 largo.
- Spotify: token expirado, playlist borrada, permisos 403.
- En vuelo: sin red, cambio de hora del evento vs fotos.

**Seguridad:** no exponer tokens Spotify al cliente; no IDOR en fotos/votos.

---

## Data (`agents/data.txt`)

**Eventos sugeridos (sin PII):**

- `invitations_hub_opened`, `bulk_email_started`, `bulk_email_completed` (counts agregados).
- `spotify_connect_completed`, `spotify_track_suggested` (si aplica).
- `flight_program_photo_attached` (modo: por_hito | por_hora).

**Calidad:** no registrar emails ni teléfonos en analytics.

---

## Growth (`agents/growth.txt`)

**Embudo:** activación = “preview vista + al menos un envío” (correo o WA manual).

**Hipótesis:** una card “Invitaciones” reduce tiempo hasta primer envío vs dispersión actual.

**Guardrails:** sin dark patterns; sin “últimas plazas” falsas; transparencia en límites de envío.

---

## Cierre de refinación (checklist para el equipo)

- [ ] PM: orden de entrega de HUs B02-01 … B02-05.
- [ ] UX: wireframe baja fidelidad del hub “en vuelo”.
- [ ] Tech: spike Spotify (scopes + votos) y spike fotos↔hito.
- [ ] Legal/compliance: WhatsApp Business si se avanza a API.
- [ ] Sincronizar con B01-04 (botonera) **después** de fijar cards por fase.
