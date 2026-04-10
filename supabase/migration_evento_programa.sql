-- Programa / cronograma del evento (gestión en dashboard, lectura pública vía RPC en invitación).

create table if not exists public.evento_programa_hitos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  hora time not null,
  titulo text not null,
  descripcion_corta text,
  lugar_nombre text,
  ubicacion_url text,
  icono text not null default 'Music' check (icono in ('Church', 'Beer', 'Utensils', 'Music')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_evento_programa_evento on public.evento_programa_hitos (evento_id, orden, hora);

alter table public.evento_programa_hitos enable row level security;

create policy "evento_programa_hitos_select" on public.evento_programa_hitos
  for select using (public.user_is_evento_member(evento_id));

create policy "evento_programa_hitos_insert" on public.evento_programa_hitos
  for insert with check (public.user_is_evento_editor_or_admin(evento_id));

create policy "evento_programa_hitos_update" on public.evento_programa_hitos
  for update using (public.user_is_evento_editor_or_admin(evento_id))
  with check (public.user_is_evento_editor_or_admin(evento_id));

create policy "evento_programa_hitos_delete" on public.evento_programa_hitos
  for delete using (public.user_is_evento_editor_or_admin(evento_id));

-- Invitación pública: solo si el token/id de invitado pertenece al mismo evento.
create or replace function public.programa_evento_lista_publica(p_token text)
returns setof public.evento_programa_hitos
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select h.*
  from public.evento_programa_hitos h
  inner join public.invitados i on i.evento_id = h.evento_id
  where i.evento_id is not null
    and (
      i.id::text = p_token
      or (i.token_acceso is not null and i.token_acceso::text = p_token)
    )
  order by h.orden asc, h.hora asc;
$$;

revoke all on function public.programa_evento_lista_publica(text) from public;
grant execute on function public.programa_evento_lista_publica(text) to anon;
grant execute on function public.programa_evento_lista_publica(text) to authenticated;
grant execute on function public.programa_evento_lista_publica(text) to service_role;
