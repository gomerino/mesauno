-- Sesiones de checkout previas al evento (Checkout Pro: external_reference = checkout_sessions.id)
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  plan text not null check (plan in ('esencial', 'experiencia')),
  nombre text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'provisioned')),
  mp_preference_id text,
  mp_payment_id text unique,
  evento_id uuid references public.eventos (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_checkout_sessions_email on public.checkout_sessions (lower(email));

alter table public.eventos add column if not exists plan text;

alter table public.eventos drop constraint if exists eventos_plan_check;

alter table public.eventos
  add constraint eventos_plan_check check (plan is null or plan in ('esencial', 'experiencia'));

comment on table public.checkout_sessions is 'Compra inicial plan+email+nombre; external_reference en MP apunta aquí.';
comment on column public.eventos.plan is 'Plan contratado en checkout (esencial | experiencia).';

-- Idempotencia: un solo evento por sesión de checkout (reintentos success/webhook).
alter table public.eventos add column if not exists checkout_session_id uuid;
create unique index if not exists eventos_checkout_session_id_key on public.eventos (checkout_session_id)
  where checkout_session_id is not null;

alter table public.checkout_sessions enable row level security;
