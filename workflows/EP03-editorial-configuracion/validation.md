# Validación

Implementación local completada. Editorial Premium se selecciona mediante el catálogo común, se guarda por apply_evento_theme y se resuelve desde eventos.theme_id. No se cambian automáticamente invitaciones existentes.

## Pruebas

- TypeScript: `npx tsc --noEmit --incremental false`, correcto.
- Lint de los cinco archivos de integración: correcto.
- Playwright: 16 pruebas correctas en Chromium y WebKit; formularios y uploads con respuestas interceptadas, sin escrituras en producción.
- Resolver ampliado: 2 ejecuciones correctas adicionales con precedencia y compatibilidad de estilos anteriores.
- Comparación visual: diferencia 0,0752 % móvil y 0,0042 % escritorio; geometría de nueve bloques idéntica. Se conserva fondo oscuro de respaldo si falla la imagen.

## Pendiente de despliegue

Aplicar `supabase/migration_editorial_premium_tema_invitacion.sql` antes de publicar el selector. No se ejecutó en producción. No se verificó guardado contra la base real ni una sesión autenticada del panel. La prueba funcional valida los contratos existentes con interceptación.

La portada seleccionada y la visibilidad del pase conservan los overrides existentes; esta etapa no añade campos persistentes de personalización.

## Archivos de esta integración

- src/lib/invitacion-theme.ts
- src/app/invitacion/[token]/page.tsx
- src/components/panel/InvitationThemePicker.tsx
- src/components/panel/InvitacionFullPreview.tsx
- src/components/panel/EventoDatosBoardingPassPreview.tsx
- supabase/migration_editorial_premium_tema_invitacion.sql
- e2e/specs/editorial-preview.spec.ts
- workflows/EP03-editorial-configuracion/*.md

Preview local: http://127.0.0.1:3000/invitacion/editorial-preview?theme=editorial-premium

## Ajustes de ubicación y navegación solicitados

Editorial Premium muestra nombre del lugar seguido de dirección completa, con deduplicación cuando esta ya empieza por el nombre. «Lugar y horario» sustituye al botón de desplazamiento; «Más detalles» reemplaza el título anterior. «Cómo llegar» abre directamente el enlace Google Maps existente en otra pestaña. Los demás templates y servicios no cambian. La referencia de la prueba visual incorpora explícitamente estos cambios solicitados; el HTML original permanece intacto.

Corrección posterior: el detalle de ubicación reutiliza `addressForMapFromPass`, igual que Google Maps, cuando el evento no trae dirección completa. El RPC público definido en el repositorio no incluye direccion_evento_completa; el respaldo configurado NEXT_PUBLIC_EVENT_ADDRESS sí contiene la dirección. Nombre y dirección aparecen en líneas separadas. El fixture contiene una dirección explícitamente ficticia para comprobar el renderizado. Pendiente validar la URL real del usuario.

## Programa editorial

Nueva presentación opcional de InvitacionCronograma: línea de tiempo serif con horarios, descripciones, lugares, enlaces y fotos existentes. Reutiliza el cálculo actual de Ahora/Próximo; presentación predeterminada sin cambios. Diálogo con cierre sticky solo en programa. No se desplaza automáticamente al abrir la versión editorial para preservar la lectura y el foco.

Vista durante el evento: se omite mensaje de bienvenida; compartir fotos y LiveGallery en la página, sin modal intermedio. Dirección, mapa y programa debajo de la galería y antes del pase. Antes/después sin cambios. Demo sin suscripciones ni escrituras.

Después del evento: álbum directamente en la página, texto de agradecimiento y descarga individual desde la foto ampliada. LiveGallery incorpora allowDownload optativo (false por defecto); descarga blob del mismo objeto público, con error/reintento y confirmación. Sin nuevos endpoints ni cambios de permisos.

Agrupación del álbum real: LiveGallery recibe grupos opcionales desde programaFotosPorHito. Editorial actualiza esa asociación llamando al RPC existente programa_con_fotos_ventanas_publica con el token al cambiar las fotos. No se recalculan ventanas horarias en frontend. Encabezados hora/título, fotos sin asociación en Otros recuerdos; el programa emergente usa el mismo estado. Descarga y ampliación conservadas. Validación Playwright con RPC interceptado, sin escrituras reales.

Antes del evento: se ocultan dietas del menú y del RSVP. El nombre se presenta como texto, no como input. El contrato mantiene las restricciones previamente guardadas para evitar borrarlas al responder. Pruebas cubren confirmación, error/reintento y modificación con nombre no editable.

## Preparación de publicación — 10 de octubre de 2026

Estado final: nombres en tres líneas; RSVP sin nombre editable ni dietas antes del evento; programa editorial; vista del día enfocada en fotos; álbum posterior sin secciones inferiores, con agrupación por RPC y descarga individual.

Validación final: 18 pruebas Playwright aprobadas (Chromium y WebKit), incluida comparación visual a 390/1280 px. Build de producción y postbuild completos en copia temporal para preservar el servidor local. Advertencias preexistentes de imágenes, hooks, metadata themeColor y Browserslist. `git diff --check` correcto. Las capturas de la invitación real quedan locales; las evidencias versionadas utilizan datos de ejemplo.

Publicación autorizada por push a main conectado a Vercel. Sin migraciones ejecutadas ni cambios en servicios RSVP, permisos o reglas de agrupación. La consulta real al RPC devolvió correctamente once momentos sin fotos asociadas: las fotos existentes están fuera de sus ventanas. El override de fase de invitaciones reales está limitado a desarrollo.
