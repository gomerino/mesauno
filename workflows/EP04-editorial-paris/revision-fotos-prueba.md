# Fotografías de prueba — revisión administrativa

Este registro identifica fixtures de pruebas automatizadas. No es un inventario de fotografías de producción: no se inspeccionó ni clasificó el contenido de imágenes reales y no se borró ni modificó ningún archivo.

| Identificador | Ruta | Origen y estado |
|---|---|---|
| foto-demo | demo/foto.jpg | Respuesta HTTP simulada en editorial-functional.spec.ts. Imagen PNG sintética de 1 píxel. No subida a Storage. |
| prueba-mismo-evento | test/propio.jpg | Control positivo sintético de pertenencia al evento. Sin subida a Storage. |
| prueba-otro-evento | test/ajeno.jpg | Evento de navegador sintético para verificar rechazo de fotos de otro evento. Sin solicitud a Storage. |
| — | public/images/editorial-premium/foto-paris-original.png | Fotografía de referencia del diseño de portada; no es un elemento del álbum. |

La revisión de fotografías de prueba que ya existan en producción debe hacerse sobre sus metadatos y contenido por un administrador. El nombre de un archivo no demuestra que sea una prueba; no se etiquetaron fotografías reales por inferencia.

## Controles revisados

- La lectura inicial utiliza fotos_evento_lista_publica con token de invitación. La definición SQL del repositorio une invitados y fotos por evento_id.
- Editorial Premium descarta filas cuyo evento_id no corresponde al invitado, tanto iniciales como recibidas por eventos de subida/realtime.
- La consulta de agrupación por programa conserva el token y comprueba el evento de la respuesta.
- No se alteraron bucket, políticas, servicios ni contratos. Estos controles de presentación no sustituyen las autorizaciones del servidor.
