import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limpiarRecuerdos } from './limpiar-recuerdos.mjs';
const evento = 'eefb9bc2-8f18-4ab9-b548-9fc85a0d4740';
function mock({ badPath = false, storageError = false, dbError = false } = {}) {
  const calls = [];
  let pages = 0;
  const rows = [{ id: 'foto-1', storage_path: `${badPath ? 'otro-evento' : evento}/foto.jpg` }];
  return {
    calls,
    storage: { from(bucket) { assert.equal(bucket, 'fotos_eventos'); return { async remove(paths) { calls.push(['storage', paths]); return { error: storageError ? {} : null }; } }; } },
    from(table) {
      let deleting = false;
      const query = {
        select() { return query; }, eq(field, value) { assert.equal(value, evento); return query; }, order() { return query; }, limit() { return query; }, gt() { return query; },
        delete() { deleting = true; return query; }, in(field, ids) { assert.deepEqual(ids, ['foto-1']); return query; },
        async single() { return { data: { id: evento, nombre_evento: 'Prueba' } }; },
        then(resolve, reject) {
          if (deleting) calls.push(['db']);
          return Promise.resolve(deleting ? { data: rows, error: dbError ? {} : null } : { data: pages++ === 0 ? rows : [] }).then(resolve, reject);
        },
      };
      assert(['eventos', 'evento_fotos'].includes(table));
      return query;
    },
  };
}
const options = { ejecutar: true, log() {} };
test('simulación no modifica Storage ni registros', async () => {
  const db = mock(); assert.deepEqual(await limpiarRecuerdos(db, evento, { log() {} }), { previstas: 1, eliminadas: 0 }); assert.deepEqual(db.calls, []);
});
test('elimina primero Storage y después solo los registros seleccionados', async () => {
  const db = mock(); assert.equal((await limpiarRecuerdos(db, evento, options)).eliminadas, 1); assert.deepEqual(db.calls.map(c => c[0]), ['storage', 'db']);
});
test('rechaza rutas de otro evento antes de borrar', async () => {
  const db = mock({ badPath: true }); await assert.rejects(limpiarRecuerdos(db, evento, options), /Ruta inesperada/); assert.deepEqual(db.calls, []);
});
test('fallo de Storage conserva registros', async () => {
  const db = mock({ storageError: true }); await assert.rejects(limpiarRecuerdos(db, evento, options), /Falló Storage/); assert.deepEqual(db.calls.map(c => c[0]), ['storage']);
});
test('fallo de Postgres informa cómo completar la limpieza', async () => {
  const db = mock({ dbError: true }); await assert.rejects(limpiarRecuerdos(db, evento, options), /Vuelve a ejecutar/);
});
