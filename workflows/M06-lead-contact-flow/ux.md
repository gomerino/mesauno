# UX notes — M06 Lead contact flow

## Modal flow

```
[CTA "Solicitar contacto"] → click
  │
  ├─ User no auth?
  │   → Mini auth inline ("Creá tu cuenta en 30s · Email + password")
  │
  ├─ User auth con evento?
  │   → Modal contacto (pre-fill)
  │
  └─ User auth sin evento?
      → Modal contacto (sin pre-fill fecha/región)
```

## Modal contacto — layout

```
┌────────────────────────────────────────────┐
│ [x]    Contactá a Studio Luz ✈️            │
├────────────────────────────────────────────┤
│ Contexto de tu evento                      │
│   📅 Fecha:    15 de diciembre 2026  [edit]│
│   📍 Región:   Región Metropolitana  [edit]│
│                                            │
│ Tu mensaje                                 │
│ ┌────────────────────────────────────────┐ │
│ │ "Hola! Nos casamos el 15/12 y nos     │ │
│ │ encantó su trabajo. Queremos saber    │ │
│ │ más sobre el Pack Premium..."          │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Presupuesto estimado (opcional)            │
│   [Menos de $500k ▾]                       │
│                                            │
│ ¿Cómo preferís que te contacten?           │
│   ◉ WhatsApp                               │
│   ◌ Email                                  │
│                                            │
│ [Cancelar]           [Enviar solicitud →]  │
└────────────────────────────────────────────┘
```

## Confirmación (dentro del modal)

```
┌────────────────────────────────────────────┐
│               ✈️                           │
│       Solicitud enviada                    │
│                                            │
│ Studio Luz suele responder en 6-24 hs.     │
│ Te enviamos una copia a tu email.          │
│                                            │
│ [Abrir WhatsApp ahora]   ← solo si WA     │
│                                            │
│ ¿Querés contactar otros fotógrafos en RM?  │
│ [Ver proveedores similares]                │
│                                            │
│ [Cerrar]                                   │
└────────────────────────────────────────────┘
```

## Mobile

- Modal full-screen con header sticky [x].
- Bottom CTA sticky con safe-area-inset.
- Dropdown región/fecha como bottom-sheet nativo.
- Keyboard abre suavemente (resize no jumpy).

## Copy principles

- **"Solicitar contacto"** en vez de "Contactar" — implica iniciativa pero no transacción.
- **"Enviar solicitud"** en vez de "Submit".
- **"Tu mensaje"** en vez de "Message".
- **"¿Cómo preferís que te contacten?"** — voseo chileno warm.
- **Placeholder del mensaje:** sugerido pero editable, da social proof ("Así escriben otros novios").

## Validation friendly

- Mensaje mínimo 20 chars con hint "Contales un poco más del evento".
- Si omite canal: pre-seleccionar WhatsApp si provider lo tiene, si no email.

## Empty/error states

- Provider sin WhatsApp: radio WhatsApp deshabilitado con tooltip "Este proveedor prefiere email".
- Ya contactaste hoy: mensaje warm + CTAs directos.
- Error backend: toast + retry.

## Privacy transparency

- Mini texto al final: "Enviamos tu mensaje a Studio Luz con los datos de tu evento. No compartimos tu email públicamente."
