# S01 — UX

## Flujo principal (MVP)

```
Panel → Evento / Sitio público
  → toggle "Mostrar sitio público"
  → campo slug (preview URL en vivo)
  → Guardar → toast "Enlace listo" + botón copiar
```

## Pantallas

| Pantalla | Notas |
|----------|--------|
| Config (panel) | Una card clara: qué es, quién ve, cómo desactivar. |
| Vista pública `/evento/[slug]` | Hero con nombres + fecha; bloque lugar/destino; CTA suave ("¿Viene tu invitación por correo?" sin prometer RSVP). |

## Fricción

| Issue | Tamaño | Mitigación |
|-------|--------|------------|
| Usuario no entiende slug | M | Preview URL + ejemplo `juan-y-maria-2026` |
| Miedo a “sitio público” | S | Copy: "Solo quien tenga el enlace" |

## Copy (tono)

- Tuteo neutro LATAM; evitar "publicá", "mirá".
- CTA panel: "Copiar enlace del sitio", "Desactivar sitio público".

## Mobile

- Config: formulario en una columna; botón copiar full width.
- Pública: tipografía legible 16px base; hero no más de 60vh en móvil.
