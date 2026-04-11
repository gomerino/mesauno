-- Temas de invitación (Mesa Uno). En código la entidad es `invitados` (invitation pública por token).

create table if not exists public.themes (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into public.themes (id, name, slug)
values
  ('legacy', 'Clásico', 'legacy'),
  ('soft-aviation', 'Premium Aviation', 'soft-aviation')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug;

alter table public.invitados
  add column if not exists theme_id text not null default 'legacy'
  references public.themes (id) on update cascade on delete restrict;

create index if not exists idx_invitados_theme on public.invitados (theme_id);

alter table public.themes enable row level security;

create policy "themes_select_public" on public.themes
  for select using (true);

comment on table public.themes is 'Slug de tema de UI para la landing /invitacion/[token].';
comment on column public.invitados.theme_id is 'FK a themes.id (legacy | soft-aviation).';
