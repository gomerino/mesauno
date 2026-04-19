# UX notes — M05 Provider detail page

## Layout

```
┌──────────────────────────────────────────┐
│  ← Volver al marketplace                 │
├──────────────────────────────────────────┤
│                                          │
│   [HERO: foto destacada gran aspect]     │
│                                          │
│   · Badge Premium ✈️  · Fotografía       │
│                                          │
│   Studio Luz                             │
│   "Capturamos cada pausa"                │
│   📍 Región Metropolitana                │
│                                          │
│   [Solicitar contacto]  [♡ Agregar]      │
├──────────────────────────────────────────┤
│  Portfolio                               │
│  ┌───┐ ┌───┐ ┌───┐                       │
│  │   │ │   │ │   │                       │
│  └───┘ └───┘ └───┘                       │
├──────────────────────────────────────────┤
│  Sobre Studio Luz                        │
│  [bio 3-5 líneas con expand]             │
├──────────────────────────────────────────┤
│  Servicios                               │
│  ┌──────────────────────────────────┐    │
│  │ Pack Premium     Desde $1.800k   │    │
│  │ 10h de cobertura + álbum digital │    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│  Contactá a Studio Luz                   │
│  💬 WhatsApp  ✉️ Email  📸 Instagram    │
└──────────────────────────────────────────┘

[Sticky mobile: Contactar · Guardar]
```

## Hero variants

- **Con ≥ 4 fotos:** foto destacada + 3 miniaturas al lado (desktop) / carousel (mobile).
- **Con 1–3 fotos:** foto única full-bleed.
- **Sin fotos:** gradient navy-gold + initial letter grande (fallback elegante).

## Portfolio

- Grid 3 col desktop, 2 col mobile.
- Click abre lightbox con swipe (ambos).
- Si kind='video', play icon overlay; click abre modal player.
- Alt text del campo `alt` en media.

## Servicios

- Cards simples apiladas (no muy ornamentadas).
- Precio alineado derecha.
- Si `price_from_clp` null: "Consultar" en slate.
- Click card no hace nada (MVP). En M06 puede pre-seleccionar servicio en form.

## CTAs

- **Primario:** "Solicitar contacto" (dorado glow).
- **Secundario:** "♡ Agregar a mi evento" (outline).
- **Social:** WhatsApp, email, instagram, web — bajo el primario, chips pequeñas.

## Share

- Mobile: `navigator.share` con title + url.
- Desktop fallback: copy URL to clipboard + toast "Copiado ✓".

## Microinteractions

- Hero foto: fade-in al load.
- Portfolio click: zoom smooth al lightbox.
- CTA sticky: aparece cuando hero scrollea fuera de viewport.
- Wishlist heart: bounce animation al agregar.

## Copy

- Sección bio: "Sobre [business_name]" (warm).
- Sección servicios: "Servicios" (simple).
- Sección contacto: "Contactá a [business_name]" (voseo intencional, chileno warm).
- Empty bio fallback: "Contactá a [business_name] para conocer más ✈️".

## Responsive

- Mobile: hero full-bleed, stick sections, bottom CTA sticky.
- Desktop: hero con sidebar contacto (columna fija derecha con info + CTAs).
- Tablet: mobile layout.

## A11y

- Lightbox cerrable con Esc + click fuera.
- Alt text en todas las imágenes.
- Heading hierarchy clara (h1 business_name, h2 secciones).
