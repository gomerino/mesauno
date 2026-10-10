# Técnica

Contrato InvitacionThemePageProps sin cambios. UI propia adapta el endpoint RSVP existente sin crear reglas de negocio; restriccionesFromDb conserva formato. Cronograma, música, QR y galería reutilizados. PhotoUpload añade modo inline sin cambiar default flotante. Gate de desarrollo para fixture y tokens reales; no publicación ni registro DB. Fase visual por fecha en America/Santiago, no decide autorización.

LiveGallery añade texto de estado vacío optativo, manteniendo el default. Nuevo formulario Editorial es un adaptador visual del contrato POST /api/rsvp; no introduce reglas del dominio. Foto de portada por id validado contra el álbum cargado del evento, sin persistencia.
