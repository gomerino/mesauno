-- Programa: separa tipo de momento (sistema) de título creativo.
-- Extiende `evento_programa_hitos` manteniendo compatibilidad con `icono`.

alter table public.evento_programa_hitos
  add column if not exists tipo_momento text not null default 'otro';

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'evento_programa_hitos'
      and constraint_name = 'evento_programa_hitos_tipo_momento_check'
  ) then
    alter table public.evento_programa_hitos
      drop constraint evento_programa_hitos_tipo_momento_check;
  end if;
end $$;

alter table public.evento_programa_hitos
  add constraint evento_programa_hitos_tipo_momento_check
  check (
    tipo_momento in (
      'llegada',
      'ceremonia',
      'recepcion',
      'comida',
      'fiesta',
      'foto',
      'mensaje',
      'momento_especial',
      'regalo',
      'cierre',
      'otro'
    )
  );

update public.evento_programa_hitos
set tipo_momento = case
  when tipo_momento is not null and tipo_momento <> '' then tipo_momento
  when icono = 'Church' then 'ceremonia'
  when icono = 'Beer' then 'recepcion'
  when icono = 'Utensils' then 'comida'
  when icono = 'Music' then 'fiesta'
  else 'otro'
end;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'evento_programa_hitos'
      and constraint_name = 'evento_programa_hitos_icono_check'
  ) then
    alter table public.evento_programa_hitos
      drop constraint evento_programa_hitos_icono_check;
  end if;
end $$;

alter table public.evento_programa_hitos
  add constraint evento_programa_hitos_icono_check
  check (
    icono in (
      'DoorOpen',
      'Church',
      'GlassWater',
      'UtensilsCrossed',
      'Music',
      'Camera',
      'Mic',
      'Gift',
      'ShoppingBag',
      'PlaneLanding',
      -- Legacy:
      'Beer',
      'Utensils'
    )
  );

comment on column public.evento_programa_hitos.tipo_momento is
'Clasificación del momento del programa para automatizaciones y visualización.';

-- ROLLBACK:
-- alter table public.evento_programa_hitos drop constraint if exists evento_programa_hitos_icono_check;
-- alter table public.evento_programa_hitos add constraint evento_programa_hitos_icono_check
--   check (icono in ('Church', 'Beer', 'Utensils', 'Music'));
-- alter table public.evento_programa_hitos drop constraint if exists evento_programa_hitos_tipo_momento_check;
-- alter table public.evento_programa_hitos drop column if exists tipo_momento;
