# Tarea independiente — autorización de RSVP

Hallazgo: src/app/api/rsvp/route.ts actualiza por invitadoId con cliente privilegiado, sin validar token en el handler. Revisar protecciones externas y diseñar autorización por invitación antes de corregir.

Aceptación: impedir modificar otro invitado sin credencial válida; mantener confirmación legítima y compatibilidad de clientes; cubrir pruebas negativas. No se modifica este endpoint en EP01. Pendiente de priorización independiente; no se creó issue externo.
