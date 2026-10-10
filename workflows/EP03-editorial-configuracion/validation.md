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
