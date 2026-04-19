# B02 — Módulos del viaje por fase (check-in / despegue / en vuelo)

Épica: **redefinir qué ve la pareja en cada tiempo del viaje** para que las tarjetas y rutas reflejen el trabajo real (invitaciones masivas, preview, programa, Spotify, programa interactivo en vivo) sin duplicar conceptos entre fases.

**Relación con B01:** B01 fijó **orden** de 4 cards genéricas; B02 redefine **qué módulos entran en cada fase** y puede sustituir/ampliar esas cards.

---

## Visión por tiempo (fuente de verdad de producto)

### Preparativos (`check-in`)

**Objetivo emocional:** armar base del viaje y **salir con invitaciones listas para compartir**.

| Módulo | Rol en esta fase | Notas |
|--------|------------------|--------|
| **Evento** | Datos del viaje | Ya existe `/panel/evento`. |
| **Pasajeros** | Carga y bulk | Import masivo + lista; ya existe `BulkImportInvitados` + `invitados-bulk`. |
| **Invitaciones** | Envío masivo + canales + preview | Agrupa: correo masivo (Resend), opciones WhatsApp, vista previa (`/panel/invitados/vista`). **No** editar `/invitacion/[token]` público salvo decisión explícita. |

**Fuera de esta fase (en v1 propuesta):** programa del día como tarea principal (sigue en despegue).

### Tu gran día (`despegue`)

**Objetivo:** coordinar **el día** y **la experiencia musical** antes del evento.

| Módulo | Rol | Notas |
|--------|-----|--------|
| **Programa** | Hitos del día | `/panel/programa`, `evento_programa_hitos`. |
| **Configuración experiencia** | Spotify + playlist compartida + reglas de participación | Hoy: OAuth + `playlist_id` en `evento_spotify`; cards en experiencia parcialmente placeholder. Falta: búsqueda de canciones, votos, playlist colaborativa end-to-end según API Spotify. |

### En vuelo (`en-vuelo`)

**Objetivo:** **un solo hub**: **programa interactivo** del día; desde ahí fotos, música y (opcional) interacciones.

| Tema | Decisión pendiente |
|------|-------------------|
| **Fotos ↔ programa** | Asociar por hora de subida vs hora EXIF vs hito más cercano (spike). |
| **Interacción** | Reacciones a fotos/música vs mensajes (moderación, costo, valor). |
| **Alcance** | Programa como **única superficie** de “vuelo”; resto (álbum suelto) deprecar o enlazar desde programa. |

---

## Historias (borrador para priorizar)

### B02-01 — Check-in: superficie “Invitaciones” en home

**Como** pareja en preparativos  
**Quiero** una tarjeta (o bloque) que agrupe envío masivo, WhatsApp y vista previa  
**Para** no saltar entre módulos sin contexto

**Criterios (borrador):** enlace claro a bulk email, a política de WhatsApp (1:1 vs futuro API), a preview; tracking de uso.

### B02-02 — Envío masivo correo: estado y deuda

**Como** operador  
**Quiero** saber límites de Resend, reintentos y estados fallidos  
**Para** no prometer “masivo” sin transparencia

**Dependencias:** `runBulkInvitationSend`, `RESEND_*`, métricas.

### B02-03 — WhatsApp: opciones reales

**Como** producto  
**Quiero** documentar qué hay hoy (deep link por invitado) vs roadmap (Cloud API / BSP)  
**Para** no confundir “masivo” con envío nativo

### B02-04 — Despegue: Spotify experiencia completa

**Como** pareja  
**Quiero** búsqueda, playlist compartida, votos (según viabilidad API)  
**Para** cerrar la promesa “Ambiente del viaje”

**Dependencias:** revisión técnica Spotify (scopes, cuotas, cola de votos en DB).

### B02-05 — En vuelo: programa interactivo como producto

**Como** invitado en el día  
**Quiero** ver el programa y el contenido vivo en un solo lugar  
**Para** no abrir tres pantallas

**Dependencias:** spike fotos+hora; decisión moderación.

---

## Dependencias entre B02 y backlog existente

- **T9** — sheets adaptativos encaja cuando Invitaciones tenga más pasos.
- **T10 / T11** — dirección/mapa sigue en evento; no bloquea B02.
- **B01-04** — botonera vs momentos: decidir **después** de definir cards por fase (B02).

---

## Estado

Documento vivo. Issues Linear: `node scripts/linear-seed-b02.mjs` (épica B02, spikes S1–S3, historias B02-01 … B02-05). Revisión multi-rol: `revision-por-roles.md`.

**Spikes S1–S3:** cerrados en `spike-resultados.md` (hallazgo clave S1: `SpotifyPlaylistConnect` existe pero no está montado en ninguna página del panel).

### Propuesta de orden para próximos sprints

1. ~~**Spikes:**~~ **Hecho** — ver `spike-resultados.md`; cerrar issues Linear (JUR-59 … JUR-61) con checklist al final de ese doc.
2. **Implementación check-in:** B02-01 + B02-02 (+ B02-03 copy WhatsApp).
3. **Despegue:** B02-04 — integrar UI Spotify en panel + card Experiencia según S1.
4. **En vuelo:** B02-05 — ventanas foto↔hito según S2.
