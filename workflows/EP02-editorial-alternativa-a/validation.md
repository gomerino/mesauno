# Validación — Editorial Premium / Alternativa A

## Resultado
Implementación corregida y revisada visualmente el 10 de octubre de 2026. Solo desarrollo, aún oculta del selector público. No se aplicaron migraciones ni se cambiaron endpoints, servicios o los tres templates anteriores.

## Referencia y método
- Fuente: `/Users/gonzalomerino/Downloads/jurnex-dos-alternativas.html`, solo Alternativa A.
- Chromium, viewport 390×844 y 1280×844, escala 1 para ambas capturas de cada comparación.
- Se conserva captura completa del original. Para comparar se excluye únicamente su barra A/B, que no pertenece a la invitación.
- Misma fotografía remota del prototipo; se espera la decodificación antes de capturar.
- Se comparan geometría, fuente, color, márgenes y padding de nueve elementos principales. Coinciden, excepto fondo oscuro deliberado detrás de la foto para conservar contraste si esta falla.
- Diferencia de píxeles con tolerancia de 18 niveles RGB: móvil 0.0752%; escritorio 0.0042%. No representa una certificación de accesibilidad ni mide todos los diálogos.
- Capturas revisadas visualmente: página principal, pase, formulario y escritorio. Se corrigieron coma de fecha, longitud de fecha del pase, controles extra y selector de alimentación.

## Pruebas ejecutadas
- `npx tsc --noEmit --incremental false`: aprobado.
- `next lint` dirigido a archivos TS/TSX cambiados: sin advertencias ni errores.
- `git diff --check`: aprobado.
- `PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test -c playwright.editorial.config.ts --workers=1 --reporter=line --output=/tmp/jurnex-editorial-validation`: **16 aprobados (29.9 s)**; nueve Chromium, siete WebKit con perfil iPhone 12.
- Cobertura: guard desarrollo y registro previo, medianoche de Chile, fases, 320/390/768/1280px sin overflow, diálogo/Escape/retorno de foco, RSVP error/reintento/confirmación/edición, preferencias preservando respuesta, programa/mapas/regalos, música y subida de fotos.
- WebKit permitió detectar y corregir retorno de foco después de tocar un botón. Solo cambia Editorial.
- El service worker se bloquea en la configuración de tests; las APIs no simuladas se abortan. La primera ronda WebKit detectó bypass de interceptores por el worker, con respuestas 404 para datos sintéticos. La ronda definitiva quedó aislada.

## Límites de la validación
Los tests de contratos interceptan respuestas HTTP. No verifican persistencia real en Supabase, sincronización Spotify ni recepción de eventos Realtime desde un backend real. La galería reutiliza LiveGallery y su suscripción existente. WebKit emulado no sustituye una prueba en iPhone físico. No se ejecutó build productivo ni despliegue.

## Diferencias visuales deliberadas
- La barra A/B del prototipo se sustituye por controles de preview al final, fuera de la invitación.
- RSVP muestra el nombre del invitado y conserva el estado pendiente; no renombra invitados. Mantiene selector de dietas; “Otra” abre un campo libre para no perder restricciones existentes.
- Los diálogos de programa, música, mapas, regalos y fotos incorporan contenido real en vez del texto de demostración. El pase muestra QR real solo cuando corresponde y hay token.
- El hero tiene fondo oscuro de respaldo si falla la imagen; la imagen y su degradado son los originales.
- Durante y después cambia el CTA y se añade acceso a fotos sin reordenar portada, datos y pase.

## URLs locales
- Demo segura: http://127.0.0.1:3000/invitacion/editorial-preview?theme=editorial-premium
- Durante: añadir `&phase=durante`; después: `&phase=despues`; sin pase: `&boarding=0`.
- Invitación real, solo desarrollo: `/invitacion/<token>?theme=editorial-premium`. La ruta reutiliza su carga de datos normal y las acciones operan sobre ese evento.
- Portada de un evento real: `&cover=<id-foto>` selecciona solo una foto entre las cargadas y pertenecientes a ese evento. No se persiste esta configuración.
- `contracts=1` en el fixture es exclusivamente para tests con interceptores; no usarlo para operaciones manuales.

## Archivos de esta corrección
- `src/app/invitacion/[token]/page.tsx`
- `src/components/themes/editorial-premium/EditorialPremiumTheme.tsx`
- `src/components/themes/editorial-premium/EditorialDevelopmentPreview.tsx`
- `src/components/themes/editorial-premium/EditorialDialog.tsx`
- `src/components/themes/editorial-premium/EditorialRsvpForm.tsx`
- `src/components/themes/editorial-premium/editorial.module.css`
- `src/components/invitacion/PhotoUpload.tsx`: modo inline optativo, flotante anterior intacto.
- `src/components/invitacion/LiveGallery.tsx`: texto vacío optativo, valor anterior intacto.
- `src/lib/editorial-event-phase.ts`
- `e2e/specs/editorial-preview.spec.ts`
- `e2e/specs/editorial-functional.spec.ts`
- `e2e/specs/editorial-visual.spec.ts`
- `playwright.editorial.config.ts`
- `workflows/EP02-editorial-alternativa-a/{hu,ux,ui,tech,qa,data,growth,validation}.md`
- `artifacts/editorial/`: capturas originales, implementación, comparaciones y medidas JSON.

Los cambios de registro en `src/lib/invitacion-theme.ts` y el ajuste de tipos de `InvitationThemePicker.tsx` ya pertenecían a EP01. El hallazgo de autorización de RSVP sigue registrado como tarea independiente, sin modificación del endpoint.
