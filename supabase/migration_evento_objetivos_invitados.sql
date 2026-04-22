-- Metas opcionales para misiones de invitados (invitaciones a enviar y personas con acompañantes).
alter table public.eventos
  add column if not exists objetivo_invitaciones_enviar integer null
    check (objetivo_invitaciones_enviar is null or objetivo_invitaciones_enviar >= 0);

alter table public.eventos
  add column if not exists objetivo_personas_total integer null
    check (objetivo_personas_total is null or objetivo_personas_total >= 0);

comment on column public.eventos.objetivo_invitaciones_enviar is
  'Meta opcional: cantidad de invitaciones (filas/grupos) a enviar; usada en misiones del panel.';
comment on column public.eventos.objetivo_personas_total is
  'Meta opcional: cantidad de personas (titular + acompañantes); usada en misiones del panel.';
