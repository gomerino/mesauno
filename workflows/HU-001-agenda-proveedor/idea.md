# PRODUCT: App de experriencia de eventos (Jurnex)

---

## 🔥 PRIORIDAD ALTA — OPTIMIZACIÓN UX + GROWTH (Panel & Dashboard)

### HU-010 Optimización Panel (/panel)

#### Objetivo
Mejorar claridad, confianza y activación del usuario dentro del panel principal.

#### Problemas detectados
- Lenguaje técnico (ej: “Supabase”, “evento_miembros”)
- Falta de guía clara (¿qué hago ahora?)
- No hay sentido de progreso
- No hay motivación emocional

#### Implementación

- Reemplazar textos técnicos por lenguaje usuario:
  - “Comienza configurando tu evento”
  - “Agrega tus invitados”
  - “Comparte tu invitación”

- Crear sección “Próximos pasos”:
  - Checklist visible:
    - Completar datos del evento
    - Agregar invitados
    - Compartir invitación

- Agregar barra de progreso:
  - % basado en setup del evento

- Agregar estado vacío claro (empty states)

---

### HU-011 Growth en Panel

#### Objetivo
Aumentar activación y uso del producto

#### Implementación

- Mostrar mensajes dinámicos:
  - “Ya estás a un paso de compartir tu invitación”
  - “Completa tu evento para enviarlo a tus invitados”

- Agregar micro-urgencia:
  - “Tus invitados esperan esta información”

- CTA persistente:
  - “Completar evento”

- Sugerencias inteligentes:
  - “Agrega tus primeros 10 invitados”

---

### HU-012 Optimización Dashboard (/dashboard/[evento_id])

#### Objetivo
Unificar experiencia y mejorar comprensión

#### Problemas detectados
- Separación mental entre /panel y /dashboard
- Falta de narrativa clara
- Secciones aisladas (equipo, programa, pago)

#### Implementación

- Unificar lenguaje con panel:
  - “Tu evento”
  - “Organización”
  - “Pagos”

- Crear header contextual:
  - Nombre evento
  - Fecha
  - Estado

- Agrupar secciones:
  - Organización → equipo + programa
  - Finanzas → pago

---

### HU-013 Growth en Dashboard

#### Objetivo
Mejorar engagement y avance del usuario

#### Implementación

- Indicadores de progreso:
  - % evento completo

- Nudges:
  - “Te falta completar X para tu evento”

- Recomendaciones:
  - “Agrega programa del evento”
  - “Invita a tu equipo”

---

### HU-014 Unificación Panel + Dashboard

#### Objetivo
Eliminar fricción entre vistas

#### Implementación

- Definir rol claro:
  - /panel → resumen + acciones
  - /dashboard → edición detallada

- Agregar navegación clara entre ambos

- Evitar duplicidad de funcionalidades

---

## 🟡 PRIORIDAD MEDIA — MEJORAS UX GENERALES

### HU-015 Estados vacíos (empty states)

- Diseñar estados claros cuando:
  - No hay invitados
  - No hay evento
  - No hay datos

- Incluir CTA en cada estado

---

### HU-016 Sistema de feedback visual

- Confirmaciones:
  - “Guardado correctamente”
- Errores claros
- Loading states visibles

---

## 🟢 PRIORIDAD MEDIA — GROWTH AVANZADO

### HU-017 Sistema de progreso del usuario

- Barra global:
  - % configuración completa

- Etapas:
  - Crear evento
  - Invitar personas
  - Compartir invitación

---

### HU-018 Activación temprana

- Primer login:
  - Guía paso a paso

- Tooltips:
  - Explicar funcionalidades clave

---

## 🔵 PRIORIDAD BAJA — FUTURO

### HU-019 Gamificación ligera

- “Tu evento está al 80%”
- Incentivo a completar

---

### HU-020 Notificaciones

- Recordatorios:
  - “Te faltan invitados”
  - “No has compartido tu invitación”

---

