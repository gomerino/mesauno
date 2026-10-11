#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function limpiarRecuerdos(db, eventoId, { ejecutar = false, log = console.log } = {}) {
  if (!UUID.test(eventoId)) throw new Error('Indica un UUID de evento válido.');
  const { data: evento, error: eventoError } = await db.from('eventos').select('id, nombre_evento').eq('id', eventoId).single();
  if (eventoError || !evento) throw new Error('No se pudo encontrar el evento. Revisa el ID y la conexión.');
  log(`Evento: ${evento.nombre_evento || 'Sin nombre'} (${evento.id})`);
  const fotos = [];
  let lastId;
  // Paginación por clave para no saltar filas cuando llegan fotos nuevas.
  while (true) {
    let query = db.from('evento_fotos').select('id, storage_path').eq('evento_id', eventoId).order('id').limit(500);
    if (lastId) query = query.gt('id', lastId);
    const { data, error } = await query;
    if (error) throw new Error('No se pudo obtener la lista completa de fotos. No se eliminó nada.');
    if (!data?.length) break;
    fotos.push(...data);
    lastId = data.at(-1).id;
  }
  for (const foto of fotos) {
    if (!foto.storage_path?.startsWith(`${eventoId}/`) || foto.storage_path.split('/').some(part => part === '..' || part === '.' || !part)) {
      throw new Error(`Ruta inesperada en la foto ${foto.id}. Operación cancelada antes de eliminar archivos.`);
    }
  }
  log(`${ejecutar ? 'Eliminar' : 'Simulación: se eliminarían'} ${fotos.length} fotos de fotos_eventos y sus registros en evento_fotos.`);
  if (!ejecutar || !fotos.length) return { previstas: fotos.length, eliminadas: 0 };
  let eliminadas = 0;
  for (let offset = 0; offset < fotos.length; offset += 100) {
    const batch = fotos.slice(offset, offset + 100);
    const { error: storageError } = await db.storage.from('fotos_eventos').remove(batch.map(foto => foto.storage_path));
    if (storageError) throw new Error(`Falló Storage. Se eliminaron ${eliminadas} registros previamente. Se conservan los registros del lote fallido; puedes volver a ejecutar el script.`);
    // Storage y Postgres no comparten transacción. Mantener los registros permite reintentar si falla Postgres.
    const { data, error } = await db.from('evento_fotos').delete().eq('evento_id', eventoId).in('id', batch.map(foto => foto.id)).select('id');
    if (error) throw new Error(`Se borraron los archivos de este lote, pero falló la eliminación de sus registros. Se eliminaron ${eliminadas} registros previamente. Vuelve a ejecutar el script para completar la limpieza.`);
    eliminadas += data?.length || 0;
    log(`Registros eliminados: ${eliminadas}/${fotos.length}`);
  }
  return { previstas: fotos.length, eliminadas };
}

async function main() {
  const { values } = parseArgs({ options: { evento: { type: 'string' }, ejecutar: { type: 'boolean' }, confirmar: { type: 'string' }, ayuda: { type: 'boolean' } }, strict: true });
  if (values.ayuda) {
    console.log('Simular: node scripts/limpiar-recuerdos.mjs --evento <UUID>\nEliminar definitivamente: node scripts/limpiar-recuerdos.mjs --evento <UUID> --ejecutar --confirmar <MISMO_UUID>\nUsa las credenciales de .env.local. No elimina eventos, invitados ni programa.');
    return;
  }
  if (!values.evento || !UUID.test(values.evento)) throw new Error('Debes indicar --evento con el UUID del evento, no el token de una invitación.');
  if (values.ejecutar && values.confirmar !== values.evento) throw new Error('Para eliminar definitivamente, agrega --confirmar con el mismo UUID de --evento.');
  dotenv.config({ path: '.env.local', quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.');
  console.log(`Proyecto Supabase: ${new URL(url).hostname}`);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await limpiarRecuerdos(db, values.evento, { ejecutar: values.ejecutar });
  console.log(values.ejecutar ? `Limpieza terminada: ${result.eliminadas} fotos eliminadas.` : 'Simulación terminada. No se modificó ningún dato.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
