# Technical spec — M06 Lead contact flow

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/leads` | `{ provider_id, channel, message, budget_range?, evento_id? }` | `{ lead_id, provider_capped }` or 409 |
| GET | `/api/leads/me` | — | Leads enviados por el novio (para futuro dashboard) |

## Server logic

```ts
// src/lib/providers/leads.ts
export async function createLead(input: CreateLeadInput, user: AuthUser) {
  // 1. Rate limit global per user
  const today = await countLeadsBySenderToday(user.id);
  if (today >= 5) throw new LeadError("rate_limit_daily", 429);

  // 2. Per-provider duplicate check (UNIQUE en DB es defensa final)
  const existing = await findLeadToday(input.provider_id, user.id, input.channel);
  if (existing) throw new LeadError("duplicate_today", 409);

  // 3. Provider status check
  const provider = await getProviderById(input.provider_id);
  if (!provider || provider.status !== "approved") throw new LeadError("provider_unavailable", 409);

  // 4. Plan cap
  const capped = provider.plan === "free" && provider.leads_this_month >= 3;

  // 5. Insert
  const lead = await insertLead({ ...input, sender_user_id: user.id, plan_capped: capped });

  // 6. Increment counter (via trigger or here)
  await incrementLeadsThisMonth(input.provider_id);

  // 7. Emails (no bloqueante)
  if (!capped) queueEmail("provider-new-lead", { provider, lead });
  queueEmail("novio-lead-copy", { user, lead, provider });

  return { lead_id: lead.id, provider_capped: capped };
}
```

## Rate limiting

- DB-level: `UNIQUE(provider_id, sender_user_id, channel, day_bucket)`.
- Global per user: query `provider_leads WHERE sender_user_id = X AND day_bucket = today`.
- Edge rate limit para abuse anónimo (en login required flow, no aplica tanto).

## Lead schema addition

Añadir a `provider_leads` (M01):
```sql
alter table public.provider_leads
  add column plan_capped boolean not null default false,
  add column budget_range text;  -- '<500k' | '500k-1m' | '1m-3m' | '>3m' | null
```

Actualizar migración M01 o crear M01b de adjustment.

## Counter update

Trigger SQL:
```sql
create or replace function bump_leads_this_month()
returns trigger language plpgsql as $$
begin
  update public.providers
  set leads_this_month = leads_this_month + 1,
      updated_at = now()
  where id = NEW.provider_id;
  return NEW;
end;
$$;

create trigger trg_bump_leads
  after insert on public.provider_leads
  for each row execute function bump_leads_this_month();
```

Reset mensual: pg_cron o edge cron function a ejecutar día 1 de cada mes:
```sql
update public.providers set leads_this_month = 0;
```

## Email templates

- `provider-new-lead.html`: asunto "Nueva solicitud para [business_name] ✈️".
- `novio-lead-copy.html`: asunto "Enviamos tu solicitud a [business_name]".
- Vars safe-escaped.

## WhatsApp deep link

```ts
function buildWhatsAppUrl(phoneE164: string, message: string) {
  const cleaned = phoneE164.replace(/^\+/, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}
```

## Anti-abuse

- Captcha (Turnstile) si no hay login (MVP requiere login, no aplica).
- Honeypot field en modal por si bots.
- Log de IP al crear lead (no exposed, solo for admin review).

## Error shape

```ts
type LeadError = {
  code: "rate_limit_daily" | "duplicate_today" | "provider_unavailable" | "invalid_input" | "server_error";
  message: string;
};
```

Frontend muestra mensajes mapeados warm por code.

## Risks

- **Email provider bounce:** if provider email inválido, el lead se crea pero provider no notifica. Log + revisar en admin.
- **Counter drift:** trigger falla silently; agregar job reconciliation nightly comparando counter vs count(*).
- **Privacy leak:** NO exponer email del novio en el email al provider (usar only nombre + evento context + botón "Responder" que abre WhatsApp/mailto con info controlada).
