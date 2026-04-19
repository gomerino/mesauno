# Technical spec — M02 Provider onboarding

## Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/para-proveedores` | Landing pública |
| GET | `/para-proveedores/registro` | Stepper (client component con URL state `?step=1|2|3`) |
| POST | `/api/providers/register` | Crea `auth.users` (o reusa) + row en `providers` (pending) |
| PATCH | `/api/providers/me` | Update parcial (usado en paso 2/3 y en M03) |
| POST | `/api/providers/me/media` | Upload + crea row en `provider_media` |
| DELETE | `/api/providers/me/media/:id` | Borra storage + row |
| GET | `/api/admin/providers?status=pending` | Lista pending (admin allowlist) |
| POST | `/api/admin/providers/:id/approve` | Aprueba |
| POST | `/api/admin/providers/:id/suspend` | Suspende con reason_code |

## Admin allowlist

- `env`: `ADMIN_EMAILS="gonzalo@jurnex.cl,cofounder@jurnex.cl"`.
- Helper `src/lib/admin/is-admin.ts` → `isAdmin(user)` compara email con `process.env.ADMIN_EMAILS.split(",")`.
- Middleware en route handlers `/api/admin/*` → 403 si no.

## Slug generation

```ts
// src/lib/providers/slug.ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function ensureUniqueSlug(base: string, checkExists: (slug: string) => Promise<boolean>): Promise<string> {
  const s = slugify(base);
  if (!(await checkExists(s))) return s;
  for (let i = 2; i < 100; i++) {
    const c = `${s}-${i}`;
    if (!(await checkExists(c))) return c;
  }
  return `${s}-${Math.random().toString(36).slice(2, 8)}`;
}
```

## Media upload flow

1. Client selecciona foto.
2. Validación client: size ≤ 10MB, mime image/jpeg|png|webp.
3. Compresión opcional client-side (`browser-image-compression` o canvas manual) a max 1920px.
4. POST a `/api/providers/me/media` con FormData.
5. Server: valida auth, sube a Supabase Storage bucket `provider-media` path `${provider_id}/${uuid}.webp`, inserta row en `provider_media`, devuelve URL.
6. Cleanup: si upload succeeds pero insert falla, borrar objeto storage (try/finally).

## Email service

- Abstraer en `src/lib/email/send.ts` con interfaz `sendEmail({ to, template, vars })`.
- Implementación MVP: Resend (si hay API key) o console.log fallback.
- Templates HTML simples en `src/lib/email/templates/`:
  - `provider-welcome-pending.html`
  - `provider-approved.html`
  - `provider-suspended.html`
  - `admin-new-provider.html`

## Draft persistence

- LocalStorage key `jurnex:provider-registration-draft`.
- Estructura `{ step, data, updated_at }`.
- TTL 7 días (check `updated_at`).
- Limpiar al completar paso 3 exitosamente.

## Risks

- **Race: user crea cuenta pero el POST de provider falla:** API route debe ser transaccional; si falla inserción `providers`, borrar user recién creado.
- **Email no configurado:** no bloquear flow; solo log + flag `emailQueued: false` en response para monitoring.
- **Allowlist admin en cliente:** NUNCA; siempre server-side. Cliente solo ve link `/admin/providers` si `isAdminFromServer()` prop.
