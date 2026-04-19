# Resultados de spikes B02 (S1, S2, S3)

Fecha de cierre técnico: 2026-04-19. Fuente: revisión del repo actual.

---

## SPIKE B02-S1 — Spotify

### Qué está operativo hoy

| Pieza | Estado | Ubicación |
|-------|--------|-----------|
| OAuth Authorization Code | Implementado | `src/lib/spotify-oauth.ts`, rutas `/api/auth/spotify/authorize` y `/api/auth/spotify/callback` |
| Scopes solicitados | `playlist-modify-public`, `playlist-modify-private`, `user-read-playback-state`, `user-library-read` | `src/lib/spotify-config.ts` → `SPOTIFY_MODIFY_SCOPES` |
| Refresh token + `spotify_user_id` + `playlist_id` | Tabla `evento_spotify` (service role) | `migration_spotify_music.sql` |
| Creación automática de playlist al conectar | Sí, si OAuth OK y no hay `playlist_id` | `spotify-oauth.ts` tras callback |
| Validar/guardar playlist manual (owner o colaborativa) | Server actions | `saveSpotifyPlaylistIdAction` en `src/app/panel/actions/spotify.ts` |
| Búsqueda de canciones | **Client Credentials** (no usa token del novio) | `src/lib/spotify-search-route.ts` → `/api/spotify/search`, `/api/music/search` |
| Invitado añade track a playlist | Refresh del novio + `POST` tracks | `src/app/invitacion/music-actions.ts` → `spotifyAddTracksToPlaylist` |
| Registro de “aportes” | Tabla `playlist_aportes` (track + invitado + metadata) | `playlistInsertAporte` en `spotify-credentials.ts` |
| Rate limit búsqueda / add | Por IP | `spotify-rate-limit.ts` |

### Integración panel (actualizado)

- **`SpotifyPlaylistConnect`** está montado en **`/panel/evento`** (`id="musica-spotify"`), con estado cargado vía **`spotifyGetPanelPublicState`** (service role: solo `connected` + `playlist_id` al cliente).
- Visible si **plan pago** + **admin del evento** + `SUPABASE_SERVICE_ROLE_KEY` válida.
- La card **Experiencia → Ambiente del viaje** enlaza a **`/panel/evento#musica-spotify`**.
- El callback OAuth sigue usando query `?spotify=connected`; el componente limpia la URL y ancla a `#musica-spotify`.

### Búsqueda y scopes

- La **búsqueda** no depende de los scopes OAuth del novio: usa **client_id + client_secret** (Client Credentials). Requiere `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` en servidor.
- **Añadir canciones** sí usa el **refresh token** del novio y los scopes de modificación de playlist; coherente con lo implementado.

### “Votos” vs aportes

- **Aportes:** `playlist_aportes` (invitado + track + metadata) cuando Spotify acepta el alta en lista (o solo registro si el flujo no llama a Spotify).
- **Apoyos / ranking:** tabla `playlist_apoyos` (único por evento + invitado + `track_uri`) + UI «Las más pedidas» (`MasPedidasPlaylist`) y agregación en `playlistListTopPublic`.
- **Playlist real en Spotify:** sigue dependiendo de permisos OAuth y política de la app (modo Development).
- **Fase 2:** cola de moderación antes de escribir en Spotify; notificaciones a la pareja.

### Riesgos / día del evento

- Token expirado: ya hay `spotifyRefreshAccessToken` en el camino de add track; si falla, mensaje pide reconectar (novios).
- App Spotify en modo Development: documentado en `spotify-api-error.ts` (403 si el usuario no está en “Users and access”).

### Recomendación para B02-04 (pendiente / mejora)

1. ~~Montar UI en panel~~ **Hecho** (evento + enlace desde experiencia).
2. Opcional: mostrar en panel **últimos aportes** (`playlist_aportes`) o estado “playlist activa” sin abrir Spotify.
3. Opcional: métricas `trackEvent` al conectar / guardar playlist.
4. Operativo: **Users and access** en developer.spotify.com + mismo Client ID que Vercel para evitar 403 al `POST` tracks en prod.

---

## SPIKE B02-S2 — Fotos ↔ programa (día D)

### Modelo actual

**`evento_fotos`** (`migration_evento_fotos.sql`):

- `id`, `evento_id`, `invitado_id`, `storage_path`, **`created_at`** (solo hora de registro en DB).
- **No** hay columna EXIF ni `hito_id`.

**`evento_programa_hitos`**:

- `hora` es tipo **`time`** (sin fecha); se asume el **día del evento** desde `eventos.fecha_boda` / `fecha_evento`.
- Orden: `orden`, `hora`.

**Subida** (`src/app/api/invitacion/fotos/route.ts`):

- Insert solo con `evento_id`, `invitado_id`, `storage_path`; **no** se lee metadata EXIF del archivo en servidor.

### Implicancias

| Estrategia | Viabilidad | Notas |
|------------|------------|-------|
| Asociar por **`created_at`** vs fecha evento + `hora` del hito | Alta | Requiere TZ única del evento (campo existente o supuesto America/Santiago). Comparar instante de foto con ventana `[hito - Δ, siguiente_hito - ε]`. |
| **EXIF DateTimeOriginal** | Media | Hace falta extraer en cliente al subir o en worker; nueva columna `capturada_at` opcional; imágenes sin EXIF → fallback a `created_at`. |
| **Manual (pareja arrastra foto a hito)** | Alta trazabilidad, más UX | Columna `hito_id` nullable en `evento_fotos` o tabla puente. |
| **Solo álbum global** | Ya existe vía lista por tiempo | Sin vínculo programa; peor para “hub en vuelo”. |

### Interacción (reacciones / mensajes)

- No hay tablas de reacciones o comentarios en el schema revisado.
- **v0 hub en vuelo:** timeline programa + **mismo orden** que galería filtrada por ventana de hito (solo lectura).
- **v1:** reacciones con moderación implica nuevas tablas + RLS + reportes; **spike aparte** si se prioriza.

### Recomendación para B02-05

1. **TZ v0:** constante `America/Santiago` en RPC (migración `migration_programa_con_fotos_publica.sql`); **fase 2:** columna TZ en `eventos` si hace falta multi-región.
2. **v0 implementado:** RPC **`programa_con_fotos_ventanas_publica(p_token)`** → `[inicio actividad, inicio siguiente horario distinto)`; misma hora en varios hitos = mismo bloque (fotos repetidas); último bloque hasta `t+3h`; `created_at >= w_start AND < w_end`.
3. **Migración opcional:** `capturada_at timestamptz` + EXIF en cliente al subir.
4. **UI “en vuelo”:** consumir esta RPC en invitación (sustituir o complementar `programa_evento_lista_publica` + `fotos_evento_lista_publica`).

---

## SPIKE B02-S3 — WhatsApp masivo vs 1:1

### Qué hay hoy en producto

- **`WhatsAppInviteButton`** (`src/components/dashboard/WhatsAppInviteButton.tsx`):
  - Construye `https://wa.me/{digits}?text={mensaje}` con mensaje que incluye URL de invitación.
  - **Un destinatario por clic**; el usuario debe enviar desde su WhatsApp.
  - Sin servidor intermedio; sin costo API; sin plantillas Meta.
- Analytics: `trackEvent("invite_link_copied", { method: "whatsapp", ... })` (nombre del evento heredado de otro flujo; revisar coherencia de nombres).

### Qué no hay

- **WhatsApp Business Platform (Cloud API)** o BSP: no hay envíos server-side, no hay plantillas aprobadas, no hay métricas de entrega.
- **Broadcast masivo real** implica: cuenta WABA, verificación de negocio, límitas de conversación, costo por conversación, opt-in explícito y cumplimiento normativo (según mercado).

### Qué puede prometer la UI (recomendación)

- **Hoy:** “Enviar por WhatsApp” = **abrir chat con mensaje listo** para **un** invitado con teléfono válido (código país).
- **No prometer:** “envío masivo automático por WhatsApp” hasta tener integración y compliance cerrados.

### Roadmap (fuera de este spike de código)

- Evaluar **Meta Cloud API** vs **BSP** (Twilio, MessageBird, etc.): tiempo de aprobación, costo fijo + variable, soporte LATAM.
- Ticket futuro: plantillas en español, flujo opt-in, almacenamiento de consentimiento.

### Recomendación para B02-03

- Una página interna o sección en `InvitadosManager` / hub: **“Cómo funciona WhatsApp en Jurnex”** (3–5 bullets) alineada a lo anterior.
- Copy en bulk: si se ofrece “correo masivo”, contrastar con “WhatsApp: abre el chat por invitado”.

---

## Checklist de salida (cierre spikes Linear)

- [x] **B02-S1:** panel + invitación + tablas aportes/apoyos; riesgo 403 Spotify documentado.
- [x] **B02-S2:** v0 = ventanas `created_at` + TZ fija en RPC `programa_con_fotos_ventanas_publica`.
- [x] **B02-S3:** doc 1:1 vs masivo API; sin prometer masivo en UI.

**Script:** `node scripts/linear-b02-spike-close.mjs` (comentario + Done en issues que matcheen título).

---

## Referencias rápidas de archivos

```
src/lib/spotify-config.ts
src/lib/spotify-oauth.ts
src/lib/spotify-search-route.ts
src/app/invitacion/music-actions.ts
src/components/panel/SpotifyPlaylistConnect.tsx
src/app/panel/evento/page.tsx                    # bloque #musica-spotify
src/components/invitacion/MasPedidasPlaylist.tsx
src/components/dashboard/WhatsAppInviteButton.tsx
supabase/migration_evento_fotos.sql
supabase/migration_evento_programa.sql
supabase/migration_programa_con_fotos_publica.sql   # programa + fotos por ventana
supabase/migration_playlist_apoyos.sql
```
