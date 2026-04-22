# Cómo usar este kit en Cursor

Guía breve para mover una idea desde el backlog hasta código y métricas, usando las carpetas `agents/`, `docs/` y `workflows/`.

---

## 1. PM (`agents/pm.txt`)

1. Abre una conversación nueva en Cursor (o Composer).
2. Arrastra o referencia `agents/pm.txt` y el archivo de idea (`workflows/HU-xxx/idea.md` o `hu.md`).
3. Pide: *"Using this PM prompt, write/refine user stories with acceptance criteria and edge cases for HU-xxx."*
4. Guarda la salida en `workflows/HU-xxx/hu.md` o en `docs/hu/` si quieres un registro global.

---

## 2. UX (`agents/ux.txt`)

1. Adjunta `agents/ux.txt` + `hu.md` + contexto de pantallas si existen.
2. Pide flujos, pantallas y reducción de fricción mobile-first.
3. Incorpora el resultado en `workflows/HU-xxx/ux.md`.

---

## 3. UI (`agents/ui.txt`)

1. Adjunta `agents/ui.txt` + `ux.md` / capturas + rutas de componentes (`src/components/panel/ds`, `panel-themes`).
2. Pide jerarquía de CTAs, consistencia de botones/superficies, estados y checklist visual (mobile + desktop).
3. Incorpora el resultado en `workflows/HU-xxx/ui.md`.

---

## 4. Growth (`agents/growth.txt`)

1. Adjunta `agents/growth.txt` + `idea.md` / `hu.md`.
2. Pide hipótesis, copy de urgencia ética, ranking y experimentos alineados a eventos analytics.
3. Actualiza `workflows/HU-xxx/growth.md`.

---

## 5. Validación

1. Usa `workflows/HU-xxx/validation.md` como plantilla.
2. Con PM + QA, marca criterios de éxito y checklist antes de merge.
3. Si el alcance cambia, ajusta `hu.md` primero y luego el resto.

---

## 6. Tech (`agents/techlead.txt`)

1. Adjunta `agents/techlead.txt`, `docs/architecture.md` y `workflows/HU-xxx/hu.md`.
2. Pide modelo de datos, rutas REST y riesgos (concurrencia, authz).
3. Vuelca decisiones en `workflows/HU-xxx/tech.md` y enlaza migraciones reales en el repo cuando existan.

---

## 7. Dev (Cursor)

1. Adjunta `agents/dev.txt` + `tech.md` + archivos relevantes del código.
2. Pide implementación por módulos de dominio, sin duplicar lógica entre rutas y UI.
3. Haz revisiones pequeñas (un vertical slice) y ejecuta lint/tests del proyecto antes de cerrar.

---

## 8. QA (`agents/qa.txt`)

1. Adjunta `agents/qa.txt` + `hu.md` + PR diff o lista de archivos tocados.
2. Pide plan de pruebas, casos borde y riesgos de seguridad (IDOR, carrera en reservas).
3. Documenta en `workflows/HU-xxx/qa.md` o en el PR.

---

## 9. Data (`agents/data.txt`)

1. Adjunta `agents/data.txt` + `growth.md` / `hu.md`.
2. Pide diccionario de eventos, propiedades y métricas; alinea nombres con instrumentación real.
3. Mantén la fuente de verdad en `workflows/HU-xxx/data.md` hasta exportar a una hoja de tracking del equipo.

---

## Referencias rápidas

| Recurso | Uso |
|---------|-----|
| `docs/architecture.md` | Stack, entidades, convenciones REST y naming |
| `agents/*.txt` | System prompts por rol |
| `workflows/HU-001-agenda-proveedor/` | Ejemplo completo de una HU |

Para una HU nueva: copia la carpeta `workflows/HU-001-agenda-proveedor/`, renómbrala (`HU-xxx-nombre-corto`), y sustituye el contenido manteniendo la misma estructura de archivos.
