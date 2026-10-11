# tech

Componentes visuales aislados y CSS local. Activo original en public. CSS variables para object-position móvil/escritorio. Sin APIs, contratos ni cambios de datos. Contenido inferior mantiene su contenedor previo.

## Etapa 2

EditorialEventDetails recibe datos y callbacks actuales. El QR reutiliza InvitacionCheckInQr con la misma condición de fase durante y token existente. No migraciones ni endpoints. Localidad separada solo desde texto corto explícito. Pase visible también durante cuando habilitado, para hacer accesible el check-in ya existente.

## Etapa 3

Variante editorial opt-in de InvitacionAlbumSection. Props opcionales de presentación en PhotoUpload y LiveGallery con defaults anteriores. Sin servicios ni políticas nuevas.

## Ajustes finales de etapa 3

La fase no escribe ni reemplaza merged.fecha_evento. Fotos iniciales/eventos/realtime filtran evento_id para Editorial; agrupación RPC comprueba evento_id. Sin cambios en servicios ni permisos.

## Refinamiento durante

InvitacionCheckInQr conserva payload/generación/descarga, añade size y presentation opcionales con defaults anteriores. EditorialCheckIn encapsula loading por lazy/Suspense, error de render y ausencia de token. No endpoints ni datos modificados.
