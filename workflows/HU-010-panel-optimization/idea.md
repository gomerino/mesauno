# HU-010 — Panel optimization (`/panel`)

Resumen de alcance. Backlog completo del producto: `workflows/HU-001-agenda-proveedor/idea.md` (sección prioridad alta).

## Objetivo

Mejorar **claridad**, **confianza** y **activación** del usuario en el panel principal (`/panel`).

## Problemas detectados

- Lenguaje técnico (p. ej. referencias a stack o identificadores internos visibles al usuario).
- Falta de guía clara (“¿qué hago ahora?”).
- Poco sentido de **progreso** hacia un evento “listo para compartir”.
- Poca **motivación emocional** en copy y jerarquía visual.

## Implementación (MVP de esta HU)

- Sustituir textos técnicos por lenguaje de usuario:
  - “Comienza configurando tu evento”
  - “Agrega tus invitados”
  - “Comparte tu invitación”
- Sección **“Próximos pasos”** con checklist visible:
  - Completar datos del evento
  - Agregar invitados
  - Compartir invitación
- **Barra de progreso** (% según criterios de setup del evento acordados en `tech.md`).
- **Estados vacíos** claros cuando falte evento, invitados o datos clave.

## Relación con otras HU

- **HU-011** Growth en panel (mensajes dinámicos, micro-urgencia, CTA persistente) puede apoyarse en los mismos datos de progreso; mantener una sola fuente de verdad para el % y los pasos.
