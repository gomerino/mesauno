-- Prueba local (PostgreSQL ≥14): orden RLS vs BEFORE INSERT + política permisiva.
-- Ejecutar como superusuario; crea rol y tablas de prueba en schema test_rls.
--
-- docker run --rm -e POSTGRES_PASSWORD=pass -p 54333:5432 postgres:16
-- psql "postgresql://postgres:pass@localhost:54333/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/rls_invitados_insert_test.sql

CREATE SCHEMA IF NOT EXISTS test_rls;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_invitado_app') THEN
    CREATE ROLE test_invitado_app LOGIN PASSWORD 'test';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION test_rls.auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('test_rls.jwt_sub', true), '')::uuid;
$$;

DROP TABLE IF EXISTS test_rls.invitados CASCADE;
DROP TABLE IF EXISTS test_rls.evento_miembros CASCADE;
DROP TABLE IF EXISTS test_rls.eventos CASCADE;

CREATE TABLE test_rls.eventos (id uuid PRIMARY KEY);
CREATE TABLE test_rls.evento_miembros (
  evento_id uuid NOT NULL REFERENCES test_rls.eventos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rol text NOT NULL DEFAULT 'admin',
  PRIMARY KEY (evento_id, user_id)
);
CREATE TABLE test_rls.invitados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid REFERENCES test_rls.eventos(id),
  owner_user_id uuid,
  nombre_pasajero text NOT NULL DEFAULT 'x'
);

ALTER TABLE test_rls.invitados ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_rls.invitados FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION test_rls.trg_invitados_owner_and_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = test_rls, public
SET row_security = off
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF test_rls.auth_uid() IS NULL THEN
      RAISE EXCEPTION 'sin uid';
    END IF;
    NEW.owner_user_id := test_rls.auth_uid();
  END IF;
  IF NEW.evento_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM test_rls.evento_miembros m
      WHERE m.evento_id = NEW.evento_id AND m.user_id = test_rls.auth_uid()
    ) THEN
      RAISE EXCEPTION 'no miembro';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inv ON test_rls.invitados;
CREATE TRIGGER trg_inv
  BEFORE INSERT OR UPDATE ON test_rls.invitados
  FOR EACH ROW
  EXECUTE PROCEDURE test_rls.trg_invitados_owner_and_evento();

-- Solo política estricta primero (una política INSERT; si hubiera otra con CHECK true, el OR la haría pasar siempre)
DROP POLICY IF EXISTS p_ins_strict ON test_rls.invitados;
DROP POLICY IF EXISTS p_ins_permissive ON test_rls.invitados;
CREATE POLICY p_ins_strict ON test_rls.invitados
  FOR INSERT
  WITH CHECK (
    test_rls.auth_uid() IS NOT NULL
    AND owner_user_id = test_rls.auth_uid()
  );

GRANT USAGE ON SCHEMA test_rls TO test_invitado_app;
GRANT INSERT, SELECT ON test_rls.invitados TO test_invitado_app;
GRANT SELECT ON test_rls.eventos, test_rls.evento_miembros TO test_invitado_app;

-- Datos: evento + membresía para uid fijo
INSERT INTO test_rls.eventos (id) VALUES ('11111111-1111-1111-1111-111111111111');
INSERT INTO test_rls.evento_miembros (evento_id, user_id, rol)
VALUES ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'admin');

-- Simular JWT sub = usuario de app (false = duración de sesión; true = solo esta transacción y se pierde)
SELECT set_config('test_rls.jwt_sub', '22222222-2222-2222-2222-222222222222', false);

SET ROLE test_invitado_app;

-- 1) Con política estricta: debe insertar (BEFORE trigger fija owner_user_id → WITH CHECK pasa)
BEGIN;
  INSERT INTO test_rls.invitados (evento_id, nombre_pasajero)
  VALUES ('11111111-1111-1111-1111-111111111111', 'a');
ROLLBACK;

-- Políticas solo las puede cambiar el dueño de la tabla (volver a postgres)
RESET ROLE;

DROP POLICY p_ins_strict ON test_rls.invitados;
CREATE POLICY p_ins_permissive ON test_rls.invitados
  FOR INSERT
  WITH CHECK (true);

SET ROLE test_invitado_app;

-- 2) Política permisiva (como TO authenticated WITH CHECK (true))
BEGIN;
  INSERT INTO test_rls.invitados (evento_id, nombre_pasajero)
  VALUES ('11111111-1111-1111-1111-111111111111', 'b');
ROLLBACK;

RESET ROLE;

DO $$
BEGIN
  RAISE NOTICE 'OK: ambos INSERT en transacción rollback no deben haber lanzado ERROR.';
END $$;
