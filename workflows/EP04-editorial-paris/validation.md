# Validación — etapa 1

Implementadas exclusivamente portada y Nuestro viaje. Servicios, rutas, permisos y otros templates sin cambios. Sin publicación ni migraciones.

## Comparación visual

Referencia: design-references/editorial-premium/referencia-diseno.png. Fotografía original copiada sin alteración a public/images/editorial-premium/foto-paris-original.png.

Primera y segunda captura en artifacts/editorial-paris, a 375×812, 390×844, 430×932 y 1440×900. Comparativas con referencia a la izquierda e implementación a la derecha. En escritorio ambas composiciones tienen ancho 852 px dentro del viewport de 1440 px.

Tras la primera revisión se redujeron altura mínima de portada de 450 a 365 px, tamaño de nombres, espacios verticales y tipografía de Nuestro viaje. La segunda comparación fue inspeccionada en los cuatro tamaños. Se corrigió además el scroll de captura para incluir la portada completa en escritorio.

Diferencias pendientes: la fotografía original tiene otra relación espacial entre pareja y torre; el recorte conserva rostros visibles, pero acerca a la pareja y recorta la torre respecto al mockup. No se alteró la imagen para simular la composición conceptual. En móvil se mantiene texto más grande que la referencia reducida y botón de al menos 48 px. Se reutiliza Playfair Display: no se dispone de la fuente exacta del mockup. No se agregó el menú decorativo del mockup sin una función definida.

## Pruebas ejecutadas

- Primera ronda Chromium: 4/4 capturas y controles responsive.
- Segunda ronda Chromium: 5/5 (4 tamaños y navegación por teclado/movimiento reducido en las 3 fases).
- WebKit: 1/1 navegación de portada en las 3 fases.
- TypeScript: npx tsc --noEmit --incremental false, correcto.
- ESLint de los 3 componentes tocados: sin advertencias ni errores.
- git diff --check: correcto.

La comparación histórica con el HTML Alternativa A queda omitida explícitamente porque fue reemplazada por esta referencia PNG. La nueva prueba editorial-paris.spec.ts genera comparativas, verifica contenido, desbordamiento y área táctil; no afirma equivalencia automática de píxeles. La revisión visual es manual.

No se ejecutó regresión completa ni auditoría AA: corresponden a la etapa 4. Información, pase, accesos, RSVP y fotografías conservan su implementación existente y quedan pendientes de rediseño en etapas 2 y 3.

## Archivos de esta etapa

- src/components/themes/editorial-premium/EditorialCover.tsx (nuevo)
- src/components/themes/editorial-premium/editorial-cover.module.css (nuevo)
- src/components/themes/editorial-premium/EditorialPremiumTheme.tsx
- src/components/themes/editorial-premium/editorial.module.css
- src/components/themes/editorial-premium/EditorialDevelopmentPreview.tsx
- public/images/editorial-premium/foto-paris-original.png (copia original)
- e2e/specs/editorial-paris.spec.ts (nuevo)
- e2e/specs/editorial-preview.spec.ts (etiqueta nueva del botón)
- e2e/specs/editorial-visual.spec.ts (referencia anterior archivada mediante skip)
- workflows/EP04-editorial-paris/{hu,ux,ui,tech,data,qa,growth,validation}.md
- artifacts/editorial-paris/*.png (evidencia de ambas iteraciones)

Preview: http://127.0.0.1:3000/invitacion/editorial-preview?theme=editorial-premium

Pendiente aprobación del usuario antes de avanzar a la etapa 2.

## Correcciones de etapa 1 tras revisión parcial

- Nombres: Baskerville con respaldo Times New Roman, peso normal, 12vw (43–52 px) móvil y 66–88 px escritorio. Mayor protagonismo, columna izquierda y ajuste de posición. Fotografía, degradados, avión y curva conservados.
- Nuestro viaje: único título en lugar de repetir el concepto del mensaje con una frase fija. Contenido completo de anfitriones intacto, incluidos saltos de línea. Ancho 30ch móvil / 48ch escritorio e interlineado 1.8.
- Estado confirmado: tarjeta compacta con indicador verde, pasajeros y modificación secundaria que abre el mismo diálogo RSVP. Pendiente/declinado conservan su presentación y lógica previas.
- No se modificaron ubicación, programa, pase ni accesos.

Capturas correccion-comparativa-390.png (referencia izquierda / resultado derecha), correccion-asistencia-390.png y correccion-pagina-390.png en artifacts/editorial-paris. Se conserva la diferencia de recorte original. El título de Nuestro viaje difiere intencionalmente de la referencia para evitar la repetición solicitada. Tipografía del sistema: puede variar ligeramente según disponibilidad local.

Pruebas finales: Chromium 5/5 (4 viewports + RSVP), WebKit 2/2 (390 + RSVP), TypeScript y lint correctos; diff sin errores. RSVP prueba error del servidor, confirmación, datos de tarjeta, reapertura y cambio a declinado usando respuestas simuladas, sin escribir datos reales.

Archivos tocados en esta corrección: EditorialCover.tsx, editorial-cover.module.css, EditorialPremiumTheme.tsx, editorial.module.css, e2e/specs/editorial-paris.spec.ts, e2e/specs/editorial-functional.spec.ts y este registro. Evidencias PNG adicionales. Detenido antes de etapa 2.

## Etapa 2 — información y pase

Implementada la sección con calendario, reloj y pin dorados, recinto/localidad explícita y enlace de Maps existente. Eliminada la dirección postal como texto principal. Pase con pasajeros y estado reales, fecha, destino, talón perforado y Ver pase completo. Portada e introducción aprobadas sin cambios.

El componente reutiliza InvitacionCheckInQr cuando hay token y fase durante; sin códigos decorativos. La visibilidad del pase respeta showBoardingPass. Se hace accesible también durante el evento para permitir el check-in existente; después conserva el álbum sin pase. No se modificaron APIs, servicios, esquema ni permisos.

Comparación visual a 390 y 430 px contra el recorte de información/pase del PNG aprobado. Tras la primera comparación se separó día/fecha y se compactaron espacios de campos y talón. Capturas finales en artifacts/editorial-etapa2/{referencia,resultado,comparativa}-{390,430}.png. Diferencias deliberadas: texto y controles legibles más grandes que el mockup reducido, talón debajo en móvil y a la derecha en escritorio, datos del fixture distintos a los del mockup, sin QR antes del evento o en demo. No se afirma igualdad de píxeles.

Pruebas: 24/24 aprobadas en Chromium y WebKit (suite editorial-preview, editorial-functional y editorial-details). Cubren RSVP/estados, programa/mapa/regalos/música, fotos existentes, fases, teclado/foco, visibilidad del pase, ausencia de QR en demo/antes/después y descarga de QR usando fixture de contratos con solicitudes externas bloqueadas. No existían pruebas dedicadas al escaneo de check-in; la nueva cobertura valida presentación y descarga, no un ingreso real en producción. La prueba existente 05-invitacion-vista fue ejecutada y omitida por falta de credenciales E2E.

Se detectó y corrigió pérdida de foco al cerrar RSVP después de transformar su disparador en tarjeta: EditorialDialog restaura el foco al elemento con el mismo id. TypeScript, lint de componentes tocados y git diff --check correctos.

Archivos de esta etapa:
- src/components/themes/editorial-premium/EditorialEventDetails.tsx (nuevo)
- src/components/themes/editorial-premium/editorial-details.module.css (nuevo)
- src/components/themes/editorial-premium/EditorialPremiumTheme.tsx
- src/components/themes/editorial-premium/EditorialDialog.tsx
- e2e/specs/editorial-details.spec.ts (nuevo)
- e2e/specs/editorial-functional.spec.ts
- e2e/specs/editorial-preview.spec.ts
- workflows/EP04-editorial-paris/*.md (registro por rol)
- artifacts/editorial-etapa2/*.png

Detenido antes de etapa 3, sin publicación ni migraciones.

## Etapa 3 — cierre

Pase simplificado: termina tras fecha y destino, sin avión inferior, frase ni Ver pase completo. Se conserva el componente real del pase/QR; Mi QR de check-in aparece fuera de la tarjeta durante el evento cuando el pase está habilitado y existe token real. No QR en demo. Nombres de pasajeros a 18 px, con ajuste de línea.

Más detalles: seis tarjetas (programa, mapa, regalos, música, dietas, fotos) cuando las funcionalidades están disponibles. Dos columnas en móvil, una bajo 360 px y tres en escritorio. Todas usan diálogos/enlaces existentes. Dietas guarda mediante el formulario RSVP actual sin cambiar asistencia. Estados pendiente, confirmado y declinado conservados.

Fotografías: presentación editorial optativa de InvitacionAlbumSection, con PhotoUpload inline y LiveGallery. Antes: Nuestros momentos discreto; durante: Compartamos este momento; después: Nuestros recuerdos con subida y descarga existentes. La API actual valida invitación/evento sin restricción temporal: no se agregó ni eliminó ninguna regla. Se conserva agrupación por programa. Defaults previos de componentes compartidos intactos.

Validación visual: capturas antes/durante/despues a 390×844, 430×932 y 1440×900 en artifacts/editorial-etapa3. Revisión manual de móvil y escritorio: sin desbordamientos, pase simplificado, áreas táctiles amplias y grid. Se corrigió orden de mapa junto a programa y espacio entre botones del demo. La cuadrícula adapta la referencia a dos columnas móviles; el pase simplificado difiere deliberadamente del mockup conforme a la instrucción actual. Fotos del demo vacías y sin QR ficticio.

Pruebas Chromium + WebKit: suite amplia 31/34 inicialmente; repetición de capturas, dietas y upload 12 aprobadas (2 pruebas de conexión aún fallaban); corrección del estado de conexión y repetición final 2/2 aprobadas. En conjunto todos los 34 casos tienen resultado aprobado tras sus correcciones. Los fallos de selectores se ajustaron al alert del álbum y al scroll limitado por páginas cortas; un fallo transitorio de diálogo ocurrió durante HMR y pasó al repetir sin cambios simultáneos.

Problema funcional encontrado y corregido: al reiniciar una suscripción, podía persistir CLOSED de la anterior. Ahora se restablece CONNECTING y se ignoran callbacks de la suscripción cerrada. Prueba explícita verifica conexión, vacío, error de realtime, error de subida y botón disponible para reintentar. Subida/descarga y preferencias se probaron con respuestas simuladas, sin archivos ni cambios en producción.

TypeScript y lint correctos. Diff sin cambios en otros templates, endpoints ni políticas. Compatibilidad de los tres templates anteriores revisada por código y defaults compartidos; no se ejecutó una regresión visual completa con invitaciones reales de los tres (queda para etapa 4). No se desplegó ni se aplicaron migraciones.

Archivos de esta etapa:
- src/components/themes/editorial-premium/EditorialEventDetails.tsx
- src/components/themes/editorial-premium/editorial-details.module.css
- src/components/themes/editorial-premium/EditorialPremiumTheme.tsx
- src/components/themes/editorial-premium/editorial.module.css
- src/components/invitacion/InvitacionAlbumSection.tsx
- src/components/invitacion/PhotoUpload.tsx
- src/components/invitacion/LiveGallery.tsx
- e2e/specs/editorial-stage3.spec.ts (nuevo)
- e2e/specs/editorial-details.spec.ts
- e2e/specs/editorial-functional.spec.ts
- e2e/specs/editorial-preview.spec.ts
- workflows/EP04-editorial-paris/*.md
- artifacts/editorial-etapa3/*.png

Detenido para aprobación antes de etapa 4.

## Ajustes finales de etapa 3 — resultado

Orden antes: portada, mensaje, RSVP, información, pase, accesos, Nuestros momentos. Durante: QR accesible al inicio del contenido cuando corresponde, información/pase, álbum, accesos. Después: álbum primero e información/pase históricos disponibles debajo. Portada, pase y cuadrícula conservan sus estilos.

La tarjeta Fotos enfoca el único álbum inline; antes permite expandirlo en su lugar. Eliminada la galería adicional del diálogo. La demo solo abre una explicación al intentar subir fotos: no guarda datos.

Fechas: portada, información y pase usan merged.fecha_evento. Se verificó la misma fecha 20 de febrero de 2027 en las tres fases del fixture. phase únicamente altera la presentación; no escribe fecha ni datos del evento.

Fotos: filas iniciales y eventos de subida/realtime se validan contra evento_id del invitado. Respuesta de agrupación RPC debe coincidir con evento_id. La autorización del servidor sigue siendo la existente; se revisó en el repositorio la lectura con token y unión por evento. Sin cambio de permisos/servicios/DB. Fixtures identificados en revision-fotos-prueba.md; no se clasificaron ni eliminaron imágenes reales de producción.

Pruebas:
- Suite ampliada Chromium/WebKit: 38/42 aprobadas inicialmente; cuatro comprobaciones de templates SPA fallaron porque el test esperaba main, elemento inexistente en esos templates.
- Repetición con su navegación real y capturas iniciales: 12/12 aprobadas (seis capturas responsive y seis regresiones de lectura legacy/soft-aviation/jurnex-aviation). Navegación Carta/Fotos/Pase comprobada donde existe. Token compartido por el usuario; API del navegador bloqueada, sin envío de RSVP, capturas, videos ni trazas de datos reales.
- Pertenencia de fotos con controles negativo/positivo: 2/2 aprobadas. Foto ajena rechazada; foto del mismo evento aceptada; ambos datos sintéticos sin subida.
- Todos los 42 casos distintos quedan aprobados tras corregir los selectores de prueba. Cobertura: fases, fechas, orden, RSVP, dietas, QR/descarga, álbum único, subida/descarga simuladas y carga/navegación de los otros templates.
- TypeScript, lint y git diff --check correctos.

Capturas actualizadas: artifacts/editorial-etapa3/{antes,durante,despues}-{390,430,1440}.png. Capturas sin interacciones previas: muestran el estado inicial de cada fase. Fotografías de demo vacías y QR real no inventado. Sin cambios estéticos adicionales.

Archivos de estos ajustes: EditorialPremiumTheme.tsx; variantes editoriales de InvitacionAlbumSection.tsx y LiveGallery.tsx; editorial-stage3.spec.ts y editorial-functional.spec.ts; documentación del workflow y registro de fotografías de prueba.

Servidor local en http://localhost:3001. Sin despliegue ni etapa 4.

## Refinamiento exclusivo de la fase durante

QR inline visible con identificación principal y acompañantes del helper existente, sin crear tokens por asistente. Tarjeta respeta showBoardingPass como hasta ahora. QR no disponible muestra estado claro; carga diferida y error de render tienen mensajes accesibles. Ampliar QR conserva foco/escape y ofrece la descarga existente. Pase oculto del flujo durante; before/after conservan su presentación.

Portada cambia únicamente durante a Compartir fotos y pulsa el botón ya montado de PhotoUpload, abriendo su input real en el mismo gesto del usuario. Álbum único delante de fecha/hora/lugar, sin duplicar subida ni galería. Empty, fotos agrupadas, errores de subida y descarga siguen usando componentes actuales. Fecha y zona horaria no se alteraron.

Pruebas: suite ampliada 47/48 inicialmente; una petición de lectura a soft-aviation devolvió 500 durante la recompilación local. Repetición final de QR, descarga, CTA, acompañantes y lectura de los tres templates: 14/14 aprobadas en Chromium/WebKit. Before/after, RSVP, álbum con fotos, error de subida y galería única aprobados en suite amplia. TypeScript, lint y diff check correctos.

Capturas revisadas a 390×844 y 430×932: artifacts/editorial-during/durante-{390,430}.png. Son fixtures de contratos, con QR sintético de prueba y tres asistentes de ejemplo; no código de acceso de producción. La red realtime está bloqueada intencionalmente: las imágenes también documentan el estado de desconexión y álbum vacío. Se redujo el QR tras la primera revisión, quitando la repetición de instrucciones del inline; instrucciones y descarga quedan en la ampliación.

Archivos: EditorialCheckIn.tsx (nuevo), EditorialPremiumTheme.tsx, EditorialCover.tsx, editorial.module.css, InvitacionCheckInQr.tsx (props opcionales), EditorialDevelopmentPreview.tsx (acompañantes solo en fixture de contratos durante), editorial-during.spec.ts (nuevo), ajustes de pruebas editorial-details/preview/stage3, workflow y capturas.

Sin cambios a endpoints, tablas, políticas, RSVP o fechas. Sin despliegue. Detenido para revisión antes de etapa 4.
