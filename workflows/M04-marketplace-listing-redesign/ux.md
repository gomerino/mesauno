# UX notes — M04 Marketplace listing redesign

## Aesthetic direction

- Navy base (`#0B1628`) con accentos dorados (`#D4AF37`) consistente con `BoardingPassHeader`.
- Tipografía elegante (serif para hero headline, sans para UI).
- Espaciado generoso (breathing room).
- Animaciones sutiles (fade-in cards al scroll, no bouncy).

## Layout wireframe

```
┌──────────────────────────────────────────┐
│  [Navy hero con textura / gradiente]     │
│  ┌────────────────────────────────────┐  │
│  │ Conocé a los profesionales que     │  │
│  │ hacen realidad cada detalle ✈️      │  │
│  │                                    │  │
│  │ [Buscar] _______________________   │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│ [Fotografía] [Catering] [Música] [Lugar] │  ← chips scrolable
│ [Deco] [Flores] [Coord] [Video]          │
├──────────────────────────────────────────┤
│ Región: [RM ▾]  Precio: [Todos ▾]        │
│ Ordenar: [Destacados ▾]          123     │
├──────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐                     │
│ │    │ │    │ │    │  ← cards            │
│ │ 📷 │ │ 📷 │ │ 📷 │                     │
│ └────┘ └────┘ └────┘                     │
└──────────────────────────────────────────┘
```

## Card design

```
┌──────────────────────────┐
│                          │
│   [foto destacada 4:3]   │
│                          │
│  · Badge Premium ✈️      │  ← top-right overlay si premium
├──────────────────────────┤
│  Studio Luz              │
│  Fotografía · RM         │
│  "Capturamos cada pausa" │  ← tagline italic
│                          │
│  Desde $1.200.000 CLP    │
└──────────────────────────┘
```

## Copy

- Hero: "Conocé a los profesionales que hacen realidad cada detalle ✈️"
- Subcopy: "Fotógrafos, catering, música, lugar y más. Elegidos uno a uno."
- Sin CTA principal en hero (el CTA es explorar).
- Footer empty state: "No encontramos algo para tu búsqueda. Probá con menos filtros o dejanos tu interés."

## Filters interaction

- Categoría chips: 1 activa a la vez (radio). Click en la activa la deselecciona (= "Todas").
- Región: dropdown nativo mobile, custom desktop.
- Precio: dropdown con ranges predefinidos.
- Orden: dropdown.
- **Filtros aplicados** se ven como píldoras arriba del grid con [x] para quitar individual.
- Contador resultados actualizado en tiempo real.

## Premium tier visual

- Badge dorado glow sutil en corner.
- Ranking: primeros 3 destacados tienen un leve lift visual (shadow más cálida).
- No exagerar: evitar que parezca "publicidad", debe ser meritocrático visualmente.

## Mobile specifics

- Chips horizontales scrolable con snap.
- Filtros secundarios (región, precio, orden) en bottom-sheet colapsable ("Filtros" button icon).
- Infinite scroll con "Cargar más" button fallback tras 3 páginas auto-loaded.
- Cards: 1 col, aspect full width.

## Accessibility

- Todos los filtros navegables con teclado.
- Fotos con alt text (del campo `alt` en `provider_media`).
- Contraste navy/gold cumple WCAG AA (verificar gold sobre blanco específicamente).

## Microinteractions

- Card hover/tap: leve elevación + scale (1.02).
- Loading skeleton: shimmer dorado sutil.
- Empty state: ilustración warm (avión de papel) + copy amable.
