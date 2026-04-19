# UX notes — M02 Provider onboarding

## Flow (happy path)

```
/para-proveedores (landing)
  ├─ Hero: "Llegá a novios que te están buscando"
  ├─ 3 proof points (con números conservadores reales)
  ├─ Tabla Free vs Premium
  └─ CTA: "Empezar ahora"
        ↓
/para-proveedores/registro (stepper)
  Paso 1 — Cuenta
    [email] [password] [continuar]
        ↓
  Paso 2 — Sobre tu negocio
    [nombre] [categoría dropdown] [región dropdown]
    [ciudad] [tagline 1 línea] [bio textarea]
        ↓
  Paso 3 — Cómo te conocen
    [WhatsApp E.164 con validador] [instagram @] [sitio web opcional]
    [upload fotos drag-drop 1–6, primera = destacada]
        ↓
  Confirmación — "Estamos revisando tu perfil ✈️"
    · mensaje warm: "Te avisamos por correo en máximo 48 horas"
    · CTA secundario: "Ver cómo se verá tu perfil" → preview read-only de /provider
```

## Copy principles

- Tono warm + profesional. Evitar "Submit", "Register", "Upload".
- Buttons: "Continuar", "Guardar y seguir", "Terminar".
- Error messages: específicos y amigables ("Tu WhatsApp parece incompleto. Debe empezar con +56").
- Empty states: "Todavía no subiste fotos. La primera será la cara de tu perfil ✈️".

## Mobile-first

- Stepper progress bar arriba (dots dorados: actual glow, past dorado, future slate).
- CTA sticky abajo con safe-area-inset-bottom.
- Inputs 48px de alto mínimo.
- Upload de fotos: grid 2 columnas mobile, 3 desktop.
- Drag-drop opcional (fallback a input file normal en mobile).

## Pantalla de admin (`/admin/providers`)

```
┌ Providers pendientes (12) ────────────────────┐
│ [foto] Studio Luz · fotografia · RM           │
│        creado hace 3h                          │
│        [Aprobar] [Suspender] [Ver perfil]     │
│                                                │
│ [foto] DJ Aurora · musica · V Región          │
│ ...                                            │
└────────────────────────────────────────────────┘
```

- Ordenado por fecha ascendente (más viejos primero).
- Click en "Ver perfil" abre drawer con preview exacto de `/marketplace/[slug]`.
- Suspender pide `reason_code` (dropdown: `incomplete | low_quality | duplicate | other`).

## Friction audit

| Pain point | Severidad | Fix |
|---|---|---|
| Proveedores abandonan en paso 2 (demasiados campos) | M | Solo campos obligatorios marcados, resto opcional con "más tarde" |
| Upload lento / spinner sin feedback | S | Progress bar por foto + thumbs al terminar |
| No saber cuándo serán aprobados | L | Email confirmación inmediato + SLA visible (48h) |
| Admin revisa sin criterio claro | L | Checklist en sidebar: foto OK, bio coherente, región válida, categoría clara |

## Estados visuales

- **Pending (post-registro, antes de aprobar):** provider ve banner dorado en `/provider`: "Estamos revisando tu perfil ✈️ · No es visible aún".
- **Approved:** banner verde efímero (24h) "Tu perfil está visible 🎉".
- **Suspended:** banner rojo "Necesitamos más info: [reason]. Contáctanos a hola@jurnex.cl".

## Copy tone samples

- Hero landing: "Los novios de Jurnex están armando sus bodas. Queremos que te conozcan."
- CTA registro: "Empezar ahora · Es gratis"
- Confirmación: "Tu perfil está en revisión. Volvemos pronto con buenas noticias ✈️"
- Email aprobado asunto: "Bienvenido a Jurnex ✈️ Tu perfil ya es visible"
- Email rechazado asunto: "Una info más para activar tu perfil"
