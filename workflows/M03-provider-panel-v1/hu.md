# M03 — Panel proveedor v1 (perfil, servicios, media, leads)

## User story

**As a** proveedor aprobado en Jurnex
**I want** un panel donde editar mi perfil, servicios y fotos, y ver los leads que me llegan
**So that** puedo mantener mi perfil actualizado y responder rápido a novios interesados.

## Acceptance criteria

1. Ruta protegida `/provider` (requiere auth + `providers.user_id = auth.uid()`):
   - Home con resumen: estado perfil (pending/approved/suspended), KPIs básicos (views/leads últimos 30d), CTA siguiente acción.
   - Tabs: Perfil · Servicios · Fotos · Solicitudes · Plan.
2. **Perfil**: edita todos los campos de `providers` (business_name, tagline, bio, region, city, category, contactos). Guardado optimista + toast "Guardado ✓".
3. **Servicios**: CRUD de `provider_services`. Modal con name/description/category/price_from/duration. Drag-reorder con sort_order.
4. **Fotos**: grid upload/reordenar/eliminar. Hasta 6 fotos en plan free, ilimitado en premium. Primera foto = destacada (marca visual).
5. **Solicitudes**: lista de `provider_leads` con filtros por canal y fecha; detalle muestra mensaje + contexto evento (fecha/región/presupuesto si está). Botón "Abrir WhatsApp" con número del novio si fue `whatsapp`.
6. **Plan**: card Free vs Premium. Si free con uso cercano al cap (≥ 2/3 leads usados), banner dorado "Cambia a Premium para leads ilimitados".
7. Badge de estado visible siempre:
   - `pending` → banner dorado dim "Tu perfil está en revisión".
   - `approved` → sin banner (estado normal).
   - `suspended` → banner rojo con reason + contacto soporte.
8. Todos los cambios respetan RLS: imposible editar perfil ajeno.
9. Responsive mobile: tabs se convierten en bottom-nav; forms en cards apiladas.

## Edge cases

- Provider intenta agregar 7ma foto siendo free: modal "Tu plan permite 6 fotos. Desbloquea ilimitadas con Premium".
- Provider suspended intenta editar: forms deshabilitados con tooltip "Tu perfil está suspendido. Contáctanos para reactivarlo".
- Lead sin `evento_id`: mostrar contexto vacío con copy "Sin evento asociado".
- Conexión lenta / save falla: toast error con botón "Reintentar".
- Cambio de `primary_category`: si ya tiene servicios con otra category, confirmar "Vas a cambiar tu categoría principal. Tus servicios se mantienen. ¿Continuar?".

## Out of scope

- Agenda/availability (M09).
- Responder al lead desde dentro de la app (M11 — bandeja conversacional).
- Self-serve checkout plan premium (M12).
- Analytics profundo (M12 incluye analytics básicos).

## Dependencies

- M01 schema.
- M02 onboarding (necesario para tener providers que usen M03).
