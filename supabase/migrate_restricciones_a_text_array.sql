-- Si tenías restricciones_alimenticias como text y la app envía text[],
-- convierte la columna (ajusta el delimitador si usabas otro formato).

alter table public.invitados
  alter column restricciones_alimenticias type text[]
  using (
    case
      when restricciones_alimenticias is null then null
      when trim(restricciones_alimenticias::text) = '' then null
      else string_to_array(trim(restricciones_alimenticias::text), ',')
    end
  );

notify pgrst, 'reload schema';
