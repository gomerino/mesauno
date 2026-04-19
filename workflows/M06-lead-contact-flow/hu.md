# M06 — Flujo de contacto novio → proveedor (lead tracking)

## User story

**As a** novio/a interesado en un proveedor
**I want** solicitar contacto de forma simple y con mi contexto (fecha del evento, región, presupuesto)
**So that** el proveedor me responde rápido y relevantemente, y yo sigo armando mi equipo sin fricción.

## Acceptance criteria

1. Click en CTA "Solicitar contacto" (M05) abre modal `LeadModal` con:
   - Campos prellenados si auth: nombre (desde user), fecha evento (desde `eventos`), región.
   - Campos editables: mensaje (textarea con placeholder sugerido), canal preferido (`whatsapp | email`), presupuesto estimado (dropdown opcional).
   - CTA "Enviar solicitud".
2. Si user NO auth: modal muestra primero auth mini-form (email + password o magic link) → tras auth, se abre modal de contacto pre-fill.
3. Submit:
   - Crea row en `provider_leads` (canal, mensaje, contexto).
   - Respeta UNIQUE constraint: si ya hay lead mismo día/canal/provider, muestra "Ya enviaste una solicitud hoy. Podés contactar directamente:" + CTAs WhatsApp/email.
   - Actualiza `providers.leads_this_month` (trigger o backend).
4. Post-submit:
   - Pantalla confirm dentro del modal: "Solicitud enviada ✈️" + siguientes pasos ("El proveedor suele responder en X horas").
   - CTA secundario: "Abrir WhatsApp ahora" (si canal=whatsapp) con número del provider y mensaje pre-escrito.
   - Opción "Ver otros proveedores similares" → navega a `/marketplace?categoria=X&region=Y`.
5. Provider recibe notificación por email inmediata: "Tenés una nueva solicitud ✈️" con contexto + CTAs para abrir WhatsApp del novio si permite (respetando privacidad: solo se expone WhatsApp del novio si el novio eligió WhatsApp como canal).
6. Novio recibe email copia: "Enviamos tu solicitud a [provider]".
7. Respeta caps por plan:
   - Free provider: si ya tiene 3 leads este mes, lead se crea pero se marca `plan_capped=true` y el provider NO recibe notificación. Novio ve mensaje "Enviamos tu mensaje. [Provider] tiene alto volumen este mes; te sugerimos contactar también a [2 similares]".
8. Respeta anti-spam:
   - Max 5 leads por novio por día total.
   - Max 1 lead por novio → mismo provider por canal por día.
9. Funciona en mobile (modal full-screen en mobile).

## Edge cases

- Novio sin evento: permitir enviar lead con contexto mínimo (solo región y mensaje).
- Provider eliminó su WhatsApp: CTA post-submit solo email.
- Provider suspended entre view y submit: 409 con mensaje "Este proveedor no está disponible actualmente".
- Red lenta: indicador loading + timeout 15s con retry.
- Email bounce del provider: log para admin; novio ve confirmación igual (no exponer bounces).

## Out of scope

- Chat in-app (M11).
- Respuesta del provider dentro de la app (M11).
- Booking con pago (M10).
- Recordatorios automáticos al provider si no responde (M11).

## Dependencies

- M01 schema (`provider_leads`, contadores).
- M02 providers con WhatsApp/email cargados.
- M05 CTA que abre el modal.
- Email service configurado (shared con M02).
