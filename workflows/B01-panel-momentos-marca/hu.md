# B01 — Panel por momentos + marca Jurnex

**Linear (sembrado):** JUR-51 … JUR-57 · script `scripts/linear-seed-panel-momentos-marca.mjs` (idempotente).

Épica de producto: alinear el panel novios con los **tres tiempos del viaje** (metáfora ya definida en `journey-phases.ts`), homologar el **dorado premium**, decidir el rol de la **botonera** frente a una **navegación por momentos**, y cerrar un **kit de marca Jurnex** aplicable a panel y marketing.

---

## Marco: los tres tiempos

| Tiempo | Fase técnica | Intención emocional | Módulos típicos |
|--------|----------------|---------------------|-----------------|
| **Preparativos** | `check-in` | Armar base del viaje | Evento, Invitados |
| **Tu gran día** | `despegue` | Coordinar el día | Programa, Invitación, confirmaciones |
| **Experiencia** | `en-vuelo` | Vivir y compartir | Experiencia, finanzas si aplica |

La **reordenación de tarjetas** en home debe quedar **derivada de la fase activa** (ya hay `phaseBase` en `JourneyViajeClient`) y auditada para que **ningún orden contradiga** la historia del momento.

---

## NOW / Próximo sprint

| HU | Linear |
|----|--------|
| B01-01 | JUR-51 |
| B01-02 | JUR-52 |
| B01-03 | JUR-53 |
| B01-04 | JUR-54 |
| B01-05 | JUR-55 |
| B01-06 | JUR-56 |
| B01-07 | JUR-57 |

### HU-B01-01 — Reordenación explícita de tarjetas por los tres tiempos

**Estado:** implementado (JUR-51). Tabla y lógica en `src/lib/journey-card-order.ts` (`getPhaseBaseOrder`); consumo en `JourneyViajeClient`. En viewport ≤639px la tarjeta “Siguiente” (vacía o en progreso) sube al primer puesto.

**Como** pareja en el panel  
**Quiero** ver las tarjetas del viaje ordenadas según el momento en que estoy  
**Para** priorizar lo que importa ahora sin perder acceso al resto

**Criterios de aceptación**

1. Documento único (tabla) que fija el orden de las 4 cards (Evento, Pasajeros, Programa, Experiencia) para cada una de las 3 fases.
2. Implementación alineada a esa tabla; si hay conflicto con `phaseBase` actual, se ajusta código + comentario de intención.
3. En mobile, el primer card visible debe ser el **más accionable** para el momento (sin depender solo del scroll).
4. Sin regresión en analytics existentes (`mission_card_completed`, etc.).

**Fuera de alcance:** cambiar textos de copy salvo que se detecte inconsistencia con “momentos”.

---

### HU-B01-02 — Homologación look & feel dorado premium (panel)

**Como** usuario del plan Experiencia  
**Quiero** ver acentos dorados coherentes (no mezcla de teal suelto en superficies premium)  
**Para** sentir la misma calidad que la invitación

**Criterios de aceptación**

1. Auditoría visual: lista de pantallas `/panel/*` con desviaciones (sidebar, CTA, cards, banners).
2. Tokens documentados: oro primario, oro claro, sombras, bordes — alineados a `invite.gold` / tema panel existente.
3. Correcciones por lote (header, nav, cards journey, CTAs) sin tocar `/invitacion/*`.
4. Lighthouse / contraste: sin empeorar accesibilidad en texto sobre fondo oscuro.

**Dependencias:** JUR-29 descartado; este HU usa **hex/tokens fijos** o CSS vars si ya existen en el repo.

---

### HU-B01-03 — Navegación centrada en momentos (v1)

**Como** pareja  
**Quiero** orientarme por **Preparativos / Tu gran día / Experiencia**  
**Para** no pensar en nombres de rutas (`/panel/evento` vs misión)

**Criterios de aceptación**

1. Propuesta de IA: dónde vive la navegación por momentos (shell, home, ambos).
2. Implementación mínima: al menos **un patrón** visible (ej. tabs o rail segmentado por 3 momentos) que enlace a las rutas actuales.
3. Tracking: `moment_nav_clicked` con `{ moment: preparativos|gran_dia|experiencia }` (sin PII).
4. Mobile-first; no duplicar h1.

**Relación con HU-B01-04:** esta HU puede entregarse con la botonera aún visible; la decisión de recorte va en B01-04.

---

## NEXT

### HU-B01-04 — Decisión y evolución de la botonera (`JourneyPhasesBar`)

**Objetivo:** cerrar si la botonera de 3 hitos **coexiste**, se **fusiona** con la navegación por momentos o se **simplifica** (una sola jerarquía).

**Entregables**

1. Documento de decisión (1 página): opciones A/B/C con pros/contras y riesgo de confusión.
2. Si aplica: ticket de implementación derivado (deprecar duplicidad, unificar `aria-label`, etc.).
3. Criterio:** una sola fuente de verdad** para “en qué tiempo estoy”.

---

### HU-B01-05 — Branding Jurnex — kit mínimo aplicable

**Objetivo:** nombre, logo, paleta, tipografía y tono **usables** en panel shell y landings sin rework infinito.

**Entregables**

1. Logo: uso en fondo oscuro / claro (SVG), margen de seguridad, no hacer.
2. Color: navy + oro + neutros; relación con Tailwind existente.
3. Tipografía: display + body (alineado a `font-display` / `font-sans` actuales).
4. Voz: 5 reglas + ejemplos (español LATAM neutro, tuteo).
5. Aplicación: checklist “dónde ya está aplicado” vs “pendiente”.

**Fuera de alcance:** manual de marca de 40 páginas, packaging físico.

---

## LATER

### HU-B01-06 — Motion premium coherente

Micro-interacciones (hover, transiciones de card, feedback de guardado) alineadas al kit dorado; respeta `prefers-reduced-motion`.

### HU-B01-07 — Marketing y SEO bajo marca Jurnex

Landing `/`, `/para-proveedores`, `/pricing` con logo y tokens; meta OG coherentes.

---

## Mapa de dependencias

```
B01-01 (orden tarjetas) ──┐
B01-02 (dorado premium) ──┼──► experiencia unificada
B01-03 (nav momentos) ────┘
        │
        ▼
B01-04 (botonera) — decisión explícita
        │
B01-05 (branding) — en paralelo cuando haya assets
```

## Métricas sugeridas

- Tiempo hasta primera acción útil en home por fase.
- `moment_nav_clicked` / `panel_phase_clicked` (si coexiste).
- Tasa de abandono en formularios largos (antes/después de adaptativos T9).
