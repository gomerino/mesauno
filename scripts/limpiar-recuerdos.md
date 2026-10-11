# Limpiar fotos de Recuerdos

Ejecutar desde la raíz del proyecto con Node.js y las dependencias instaladas. Lee `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` desde `.env.local` o el entorno. Antes de ejecutar, revisa el proyecto Supabase mostrado por la simulación.

```sh
node scripts/limpiar-recuerdos.mjs --evento UUID_DEL_EVENTO
```

Por defecto solo informa el evento y cuántas fotos borraría. Usa el ID del evento, no el token de una invitación.

Para borrar definitivamente archivos y registros:

```sh
node scripts/limpiar-recuerdos.mjs --evento UUID_DEL_EVENTO --ejecutar --confirmar UUID_DEL_EVENTO
```

Descarga previamente las fotos que quieras conservar. La eliminación no tiene deshacer. No modifica invitados, RSVP, programa ni el evento. No elimina archivos huérfanos de Storage que no estén registrados en `evento_fotos`. Las fotos nuevas que lleguen después del listado no forman parte de la limpieza; evita realizarla mientras los invitados estén subiendo imágenes.

El script pagina la tabla, valida que cada ruta pertenezca al evento y procesa lotes de 100. Storage y Postgres no comparten una transacción: si falla un lote, se detiene y explica si ya eliminó archivos o registros. Puedes repetir la operación; Supabase permite solicitar la eliminación de objetos que ya no existen. Recarga la invitación para actualizar la galería después de limpiar.

Pruebas sin conexión ni eliminación real:

```sh
node --test scripts/limpiar-recuerdos.test.mjs
```
