# M02 — Onboarding self-serve + review manual (proveedor)

## User story

**As a** proveedor de bodas (fotógrafo, catering, lugar, etc.)
**I want** registrarme en Jurnex creando mi perfil paso a paso
**So that** puedo aparecer en el marketplace y recibir contactos de novios, tras una revisión que me da confianza y credibilidad.

## Acceptance criteria

1. Ruta pública `/para-proveedores` (landing) con:
   - Propuesta de valor clara (recibe leads cualificados).
   - Planes Free vs Premium (tabla comparativa).
   - CTA primario "Empezar ahora" → `/para-proveedores/registro`.
2. Flujo de registro `/para-proveedores/registro` en **3 pasos + confirmación**:
   - Paso 1 — Cuenta: email + password (reusa Supabase Auth).
   - Paso 2 — Negocio: nombre del negocio, categoría principal, región, ciudad, tagline corta, bio.
   - Paso 3 — Contacto y visual: WhatsApp (E.164), instagram opcional, sitio web opcional, **upload 1–6 fotos** (al menos 1 obligatoria).
   - Confirmación: "Estamos revisando tu perfil. Te avisamos por correo en ≤ 48 horas".
3. El registro crea: row en `providers` (status=`pending`, plan=`free`), rows en `provider_media` para las fotos cargadas.
4. Slug auto-generado desde `business_name` (kebab-case) con fallback a `-${id.slice(0,6)}` si ya existe.
5. Usuario queda logueado y puede ver/editar su perfil en `/provider` aunque esté `pending`.
6. Email automático al proveedor: "Recibimos tu solicitud" + a admin interno: "Nuevo provider pendiente".
7. Admin puede aprobar/rechazar desde una ruta simple `/admin/providers` (solo auth email allowlist en `env`): lista pending, botones Approve / Suspend, motivo opcional.
8. Al aprobar: status → `approved`, email al provider "Tu perfil está visible ✈️".
9. Al rechazar: status → `suspended` con `reason_code`, email "Necesitamos más info".
10. Respeta mobile-first en los 3 pasos (stepper con progreso arriba, CTA sticky abajo).

## Edge cases

- Email ya existe como novio: permitir mismo login, crear row en `providers` ligado al user existente.
- Subir foto > 10MB: error inline + comprimir client-side antes si es posible.
- Slug colisión: fallback con sufijo.
- Proveedor cierra en paso 2 y vuelve: si no completó, perdura lo ingresado (draft en localStorage) por 7 días.
- Proveedor ya aprobado vuelve a `/para-proveedores/registro`: redirige a `/provider` (no deja re-registrarse).

## Out of scope

- Panel de proveedor completo (M03).
- Self-serve checkout plan premium (M12).
- Admin multi-usuario / roles (solo allowlist env para MVP).
- Editor rico en bio (solo textarea plano en MVP).

## Dependencies

- M01 schema + storage bucket `provider-media` listos.
- Supabase Auth funcionando (ya existe).
- Servicio de email (Resend o similar). Si no está, dejar hooks + noop con console.log y crear ticket M02b.
