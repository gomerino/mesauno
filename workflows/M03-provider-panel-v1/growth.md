# Growth — M03 Provider panel v1

## Activation loop

Un provider "activado" en MVP = approved + perfil completo + primer lead recibido o respondido.

```
approved → first_edit → profile_complete → first_lead_received → first_lead_opened → retained (login D7)
```

## Hypotheses

| ID | Hypothesis | Metric |
|---|---|---|
| HG1 | "Siguiente acción" data-driven en home aumenta completeness score en +20% | avg completeness D7 |
| HG2 | Badge contador en tab Solicitudes reduce time-to-open de lead en ≥ 40% | median time_to_open |
| HG3 | Mostrar upsell Premium al hit cap (6ta foto free) convierte a Premium > 3% | upgrade conversion |

## Tactics

- **Email nudge D1 post-approval:** "Tu perfil está visible ✈️ — completá estos 3 tips para recibir más leads".
- **Email nudge D3 si perfil incompleto:** mostrar preview de competidores con perfiles más completos (ético, no doxing).
- **Email cuando llega primer lead:** con CTA directo a `/provider/solicitudes`.
- **Email resumen semanal:** "Esta semana tu perfil tuvo X vistas y Y solicitudes".

## Retention

- Provider login D7 = métrica de salud.
- Si provider no logueó D14: email "Te extrañamos ✈️ · X novios vieron tu perfil esta semana".

## Guardrails

- Sin email spam. Max 1 email/semana por provider fuera de transaccionales.
- Unsubscribe claro.
- Nunca exponer info de otros providers (nombres, emails, números).
