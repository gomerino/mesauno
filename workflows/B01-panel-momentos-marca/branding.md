# Branding Jurnex — kit mínimo (v0)

Documento vivo para alinear diseño y desarrollo. **No** reemplaza un manual de marca completo; sirve para implementar HU-B01-05.

## Nombre

- **Jurnex** — producto y marca (marketplace + panel + invitaciones).
- En UI: “Jurnex” como firma; evitar “Dreams” en copy nuevo salvo legacy controlado.

## Propuesta de valor en una línea

> Organizá tu matrimonio como un viaje: plan, invitados y experiencia en un solo lugar.

## Paleta (alineación técnica)

| Rol | Uso | Referencia en código |
|-----|-----|----------------------|
| Fondo oscuro panel | Base | `#050810`, `#0a0f1a` |
| Navy / estructura | Bordes, texto secundario | `dreams.deep`, tokens slate |
| **Oro premium** | Acentos, CTAs premium, celebración | `#D4AF37`, gradientes hacia `#E8C547`, `#b8941f` |
| Teal | Acento secundario “calma” (journey relax) | `teal-400/500` (no competir con oro en superficies premium) |

**Regla:** en flujos de pago, éxito y “Experiencia activa”, el oro **lidera**; el teal queda para estados informativos / progreso suave.

## Tipografía

- **Display:** Outfit (`font-display`) — títulos de panel y hero.
- **Cuerpo:** DM Sans (`font-sans`) — formularios y listas.
- Invitación premium: no tocar fuentes de `/invitacion/*` en este trabajo.

## Logo (entregables pendientes de diseño)

- [ ] Mark + wordmark horizontal (SVG).
- [ ] Versión monocromo claro sobre `#050810`.
- [ ] Zona de exclusión = altura de la “x” del wordmark alrededor.

Hasta tener SVG: usar wordmark tipográfico “Jurnex” con `font-display` + tracking ajustado en header marketing.

## Voz (español LATAM neutro)

- Tuteo: “tu evento”, “podés”, “completá”.
- Prohibido voseo argentino (`vos`, `tenés`, `agregá` en imperativo no estándar).
- Warm + claro: “activá”, “compartí”, “súmate”.
- Profesional en marketplace: “proveedor”, “solicitud de contacto”, nunca “lead”.

## Aplicación inmediata

1. `SiteHeader` / footers marketing: logo + oro en links hover.
2. `PanelShell`: coherencia de borde activo y CTA con tokens oro.
3. Emails y PDFs: fuera de scope de este repo salvo que existan plantillas en `src/`.

## Checklist de adopción

- [ ] Favicon + `apple-touch-icon` con marca Jurnex
- [ ] `metadata` en `layout.tsx` raíz: title template “… | Jurnex”
- [ ] OG image con marca (cuando exista asset)
