# Growth — M06 Lead contact flow

## Core loop

```
novio ve proveedor → envía lead → provider responde → booking (futuro M10)
```

Mejor lead submit rate = mejor marketplace. Esta HU es la métrica core de demand activation.

## Hypotheses

| ID | Hypothesis | Metric |
|---|---|---|
| HG1 | Pre-fill con contexto evento (fecha/región) aumenta submit rate vs form vacío +30% | submit rate |
| HG2 | Auth inline (no redirect) reduce abandon en +50% vs login page redirect | auth_inline conversion |
| HG3 | Mostrar "similares" post-submit aumenta 2do lead same-session +40% | leads per session |
| HG4 | Límite free 3 leads/mes genera ≥ 5% upgrade a premium | free→premium conversion |

## Nudges

- **Si novio agrega provider a wishlist pero no contacta en 48h:** email "Todavía podés hablar con [provider]".
- **Si novio envía 1 lead en una categoría:** sugerir 2 similares via email "Para [fotografía] en [RM], estos también son top".

## Anti-patterns (NO hacer)

- NO pedir datos innecesarios (evitar wizard de 5 pasos). Modal simple.
- NO cobrar al novio por enviar leads.
- NO hacer upsell agresivo en el flow.
- NO auto-enviar leads masivos (respetar intención del novio).

## Metrics de salud marketplace

- **≥ 60% providers recibe ≥ 1 lead/mes** → supply engagement.
- **≥ 70% leads generan WhatsApp click** → high intent.
- **< 10% leads report "spam"** (post-MVP, feature de reporting).
