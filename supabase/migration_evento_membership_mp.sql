-- Membresía Mesa Uno + Mercado Pago (plan del evento)
alter table public.eventos
  add column if not exists plan_status text not null default 'trial'
    check (plan_status in ('trial', 'paid', 'expired'));

alter table public.eventos
  add column if not exists payment_id text;

alter table public.eventos
  add column if not exists monto_pagado numeric;

comment on column public.eventos.plan_status is 'trial | paid | expired';
comment on column public.eventos.payment_id is 'ID de pago Mercado Pago (referencia)';
comment on column public.eventos.monto_pagado is 'Monto cobrado en la moneda de la preferencia (p. ej. CLP)';
