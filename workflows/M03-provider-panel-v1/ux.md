# UX notes — M03 Provider panel v1

## Information architecture

```
/provider (home)
  └─ Tabs
      ├─ Perfil
      ├─ Servicios
      ├─ Fotos
      ├─ Solicitudes
      └─ Plan
```

## Home (resumen)

```
┌ ESTADO ──────────────────────────────────┐
│  ✓ Tu perfil está visible                │
│  Jurnex · Fotografía · RM                │
├──────────────────────────────────────────┤
│  ÚLTIMOS 30 DÍAS                         │
│  ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Vistas │ │ Leads  │ │ Conv % │        │
│  │   48   │ │   5    │ │  10.4  │        │
│  └────────┘ └────────┘ └────────┘        │
├──────────────────────────────────────────┤
│  SIGUIENTE ACCIÓN                         │
│  Agrega 2 fotos más para aumentar tus    │
│  leads. Providers con ≥5 fotos reciben   │
│  2× más contactos.                       │
│  [Agregar fotos]                          │
└──────────────────────────────────────────┘
```

## Tab Perfil

- Form en una columna, inputs de 48px alto.
- Auto-save on blur con debounce 800ms.
- Preview flotante a la derecha (desktop) que muestra cómo se verá la card en marketplace — live update mientras editás.

## Tab Servicios

```
┌ Servicios (3) ──────────────── [+ Nuevo] ┐
│ ⋮ Pack Premium         $1.800.000  [edit]│
│ ⋮ Pack Ceremonia       $900.000    [edit]│
│ ⋮ Pack Pre-boda        $350.000    [edit]│
└──────────────────────────────────────────┘
```

Modal de creación/edición:
- Nombre (required)
- Categoría (pre-filled con `primary_category`)
- Precio desde (CLP, opcional — "consultar" si vacío)
- Duración estimada (minutos, opcional)
- Descripción (textarea corta, 500 chars max)
- Toggle "Activo" (si off, no aparece en marketplace)

## Tab Fotos

- Grid 2 col mobile, 4 col desktop.
- Primera foto con badge "⭐ Destacada" (se puede cambiar drag-first).
- Hover/long-press: 3 opciones — reordenar, alt text, eliminar.
- Barra superior de progreso: "3 / 6 fotos" (free) o "12 fotos" (premium).
- Upload con preview inmediato + progress bar.

## Tab Solicitudes

```
┌ Últimos 30 días · 5 solicitudes ──────────┐
│ Filtros: [Todas] [WhatsApp] [Email]       │
├──────────────────────────────────────────┤
│ ◉ Juan y María · Boda · 2026-12-15       │
│   WhatsApp · hace 2h                     │
│   "Hola, nos casamos en diciembre..."     │
│   Presupuesto estimado: $2.5M CLP        │
│   [Abrir WhatsApp ↗] [Marcar respondida] │
├──────────────────────────────────────────┤
│ ◌ Carla y Nico · Email · ayer            │
│   Presupuesto: —                         │
│   [Responder email] [...]                │
└──────────────────────────────────────────┘
```

## Tab Plan

- Card Free (actual) con checks de lo que incluye.
- Card Premium con highlights dorados: "Leads ilimitados", "Destacado en búsquedas", "Analytics", "Badge verificado ✈️".
- Precio: $29.990 CLP/mes.
- CTA: "Cambiar a Premium" (MVP: email a sales; v2 completo en M12).

## Mobile

- Tabs horizontal scrolable arriba, o bottom nav con 5 íconos.
- Home: cards apiladas (1 col).
- Preview de perfil collapsible con "Ver mi perfil público" al final.

## Copy tone

- "Agregar foto" no "Upload photo".
- "Solicitudes" (no "Leads" en UI).
- "Destacada" (no "Featured").
- "Cambiar a Premium" (no "Upgrade").
- "Desactivar servicio" (no "Disable").

## Friction audit

| Pain point | Severidad | Fix |
|---|---|---|
| Provider no sabe cómo mejorar su perfil | L | Sección "Siguiente acción" con tips data-driven |
| Cambios lentos (form submit explícito) | M | Auto-save on blur con indicador sutil |
| Leads perdidos en la bandeja | M | Badge contador en tab "Solicitudes" |
| No hay forma de marcar "respondido" | S | Toggle simple por lead (solo visual, no bloquea) |
