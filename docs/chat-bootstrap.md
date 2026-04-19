# Chat bootstrap snippets

Snippets listos para pegar en el primer mensaje de un chat nuevo cuando querés que el agente se enfoque en una HU o rol específico.

> Los snippets son **opcionales**: el repo ya tiene `AGENTS.md` en raíz y rules always-apply en `.cursor/rules/jurnex-roles.mdc`. El agente arranca con contexto completo sin necesidad de pegar nada.
>
> Usá los snippets cuando querés **foco** en un entregable concreto (una HU, un rol, un cycle).

---

## Focus — Timeline Premium (Semana 2)

```
Arrancá como equipo (PM + Tech Lead + UX + Dev + QA) trabajando en el cycle
"Semana 2 — Timeline Premium" (JUR-23 a JUR-29).

Lee primero:
- docs/product-context.md
- Los issues de Linear JUR-23..JUR-29 (vía gh o web)
- src/components/panel/journey/JourneyPhasesBar.tsx (el componente a evolucionar)
- src/theme/panel-themes.ts (accentos dorados)

Regla: NO TOCAR /marketplace, /provider, /para-proveedores, /admin/providers.
Esos son del chat paralelo. Mantenete en /panel y sus dependencias.

Empezá proponiendo plan de ataque por issue y qué tomamos primero.
```

---

## Focus — Marketplace MVP M1 (schema)

```
Arrancá como equipo (Tech Lead + Dev + QA + Data) implementando JUR-36 M1
"Modelo de datos real (providers, services, media, leads)".

Lee primero:
- workflows/M01-providers-schema/ (los 7 archivos — hu, ux, data, tech, qa, growth, validation)
- docs/product-context.md sección marketplace
- supabase/schema.sql para el baseline existente

Entregable de esta sesión:
1) Migración SQL en supabase/2026-04-27_marketplace_providers.sql (forward + rollback comentado).
2) Tipos TS append a src/types/database.ts.
3) Helpers dominio en src/lib/providers/{queries,leads,wishlist,slug}.ts.
4) Seed script de 5 providers dummy en scripts/seed-providers-dummy.mjs (opcional, solo staging).

Regla: respetar RLS obligatorio; 0 secretos en código; tipos TS compilan.
```

---

## Focus — Rol único (modo análisis)

```
Operá SOLO como <ROL> para esta sesión.

Foco: <descripción del problema>.

Outputs esperados según agents/<rol>.txt.
No entres a implementar código a menos que te lo pida.
```

Ejemplo concreto:

```
Operá SOLO como QA para esta sesión.

Foco: auditar el flujo de registro de proveedor actual (M02) contra el workflow
workflows/M02-provider-onboarding/qa.md. Revisar si los casos Q1–Q14 cubren lo
que vos detectás como crítico, proponer casos adicionales si falta algo.

Outputs esperados según agents/qa.txt (test plan + bugs + sign-off).
No entres a implementar; solo audit + recomendaciones.
```

---

## Focus — Coordinación entre chats paralelos

Usá este snippet cuando dos chats trabajan en paralelo y querés que uno NO pise lo que hace el otro.

```
Trabajamos en chats paralelos. Este chat es responsable de <SCOPE>.
El otro chat está trabajando en <OTRO_SCOPE>.

Archivos EXCLUSIVOS de este chat:
- <lista>

Archivos que NO tocar:
- <lista>

Archivos de coordinación (tocar solo appendeando, avisar antes de renombrar):
- src/types/database.ts
- .env.local
- supabase/*.sql (usar archivo propio con fecha, no editar archivos ajenos)

Si necesitás tocar algo fuera de tu scope, pará y avisá antes.
```

---

## Tips de uso

- **Siempre que abras un chat nuevo**, el agente ya tiene el `AGENTS.md` + rules cargados. No hace falta re-explicarle roles ni estructura.
- Usá los snippets para **acotar scope** o cambiar **modo de trabajo** (equipo completo vs un rol).
- Si un chat se va por las ramas, recordale: "Volvamos al foco: <scope>. Consultá `AGENTS.md` si perdiste contexto".
- Los snippets son plantillas; ajustalos con el issue ID y rutas específicas de tu caso.
