-- =============================================================================
-- Validar lista de /panel/invitados (misma lógica que la app).
-- Supabase → SQL Editor. Sustituir los UUID marcados.
-- =============================================================================

-- Paso 0: tu user id (auth.users.id), el que usa la sesión en el navegador.
-- 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'  → reemplazar

-- 1) Evento que usa el panel: primer evento_miembros por created_at (selectEventoForMember)
SELECT em.evento_id,
       em.created_at AS membresia_creada
FROM evento_miembros em
WHERE em.user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid
ORDER BY em.created_at ASC
LIMIT 5;

-- 2) Copia el evento_id de la primera fila del SELECT anterior (si no hay filas, el panel no tiene evento).
-- Sustituye EVENTO_UUID abajo. Si no tienes membresía, el panel solo lista por owner (ver sección 3 sin evento).

-- 2a) PostgREST: .eq('evento_id', eventoId)
SELECT 'por_evento_id' AS fuente,
       id,
       nombre_pasajero,
       evento_id,
       owner_user_id,
       created_at
FROM invitados
WHERE evento_id = '11111111-2222-3333-4444-555555555555'::uuid;

-- 2b) PostgREST: .eq('owner_user_id', userId)
SELECT 'por_owner' AS fuente,
       id,
       nombre_pasajero,
       evento_id,
       owner_user_id,
       created_at
FROM invitados
WHERE owner_user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;

-- 3) “Merge” del cliente (unión sin duplicar id; orden solo para revisar)
SELECT DISTINCT ON (i.id)
       i.id,
       i.nombre_pasajero,
       i.evento_id,
       i.owner_user_id,
       i.created_at
FROM (
  SELECT *
  FROM invitados
  WHERE evento_id = '11111111-2222-3333-4444-555555555555'::uuid
  UNION ALL
  SELECT *
  FROM invitados
  WHERE owner_user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid
) i
ORDER BY i.id, i.created_at DESC;

-- 4) Sin evento en panel: si NO hay fila en evento_miembros, la app solo hace:
--    .from('invitados').select(...).eq('owner_user_id', userId)
SELECT id, nombre_pasajero, evento_id, owner_user_id
FROM invitados
WHERE owner_user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;

-- 5) ¿Tienes invitados con otro owner y otro evento? (no los verás en el panel)
SELECT id, nombre_pasajero, evento_id, owner_user_id
FROM invitados
WHERE owner_user_id IS DISTINCT FROM 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid
  AND (evento_id IS DISTINCT FROM '11111111-2222-3333-4444-555555555555'::uuid OR evento_id IS NULL)
ORDER BY created_at DESC
LIMIT 30;
