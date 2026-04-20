# UX — Navegación por momentos vs botonera

## Contexto

Hoy existen dos “mapas mentales”:

1. **Barra de fases** (`JourneyPhasesBar`): Check-in → Despegue → En vuelo, con URLs `/panel/evento`, `/programa`, `/experiencia`.
2. **Cards en home** (`JourneyViajeClient`): Evento, Pasajeros, Programa, Experiencia con orden dinámico por `phase`.

Los **tres tiempos** de copy (Preparativos / Tu gran día / Experiencia ✨) ya están en el stepper; no todos los módulos caben en 3 links (faltan Invitados, Invitación, Confirmaciones en la barra).

## Opciones para B01-04

| Opción | Descripción | Riesgo |
|--------|-------------|--------|
| **A — Mantener ambas** | Stepper = macro-fase; cards = tareas dentro del home | Duplicidad visual si no se diferencian roles |
| **B — Momentos sustituyen el stepper en mobile** | Rail o tabs “3 momentos” arriba; stepper solo desktop o se retira | Más desarrollo; claridad alta |
| **C — Stepper = solo indicador** | No clicable o menos prominente; navegación principal = momentos + cards | Menos CTR directo a programa |

## Recomendación UX (borrador)

- **Desktop:** mantener **stepper** como ancla del viaje (ya invertido en JUR-23).
- **Mobile:** evaluar **un solo bloque** “Estás en: [momento]” + accesos rápidos a las 2–3 acciones del momento (evitar dos filas competidoras).
- **Invitados / Invitación / Confirmaciones:** entrar como **acciones dentro del momento** correspondiente, no como cuarto “hito” en la barra (la barra sigue siendo metáfora de vuelo, no mapa del sitio completo).

## Wireframe ASCII (home mobile, concepto)

```
┌─────────────────────────────┐
│ [Preparativos] Gran día  Exp │  ← segment control por momento
├─────────────────────────────┤
│  Tarjeta 1 (prioridad fase) │
│  Tarjeta 2                  │
│  ...                        │
└─────────────────────────────┘
```

*(Solo referencia; la implementación real puede ser rail + cards existentes.)*

## Friction audit

- Dos lugares que dicen “fase” con palabras distintas (Check-in vs Preparativos) → alinear microcopy en mismo sprint que B01-03.
