import { expect, test } from "@playwright/test";

function fechaEventoFutura(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

test.describe("Registro (onboarding)", () => {
  test("muestra error de validación si falta la fecha del evento", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: /Crea tu viaje/i })).toBeVisible();

    await page.getByLabel(/^Email/i).fill(`validacion-${Date.now()}@ejemplo.com`);
    await page.getByLabel(/Nombre novio\/a 1/i).fill("NombreUno");
    await page.getByLabel(/Nombre novio\/a 2/i).fill("NombreDos");

    const fecha = page.locator("#ob_fecha");
    await fecha.fill(fechaEventoFutura());
    await fecha.evaluate((el: HTMLInputElement) => {
      el.removeAttribute("required");
    });
    await fecha.fill("");

    await page.getByRole("button", { name: /Crear mi viaje/ }).click();

    await expect(page.locator("form p[role=\"alert\"]")).toContainText(/fecha del evento/i);
  });

  test("registro: cuenta + evento → panel o mensaje de confirmación de correo", async ({ page }) => {
    const email = `e2e-${Date.now()}@jurnex-e2e.test`;

    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: /Crea tu viaje/i })).toBeVisible();

    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/Nombre novio\/a 1/i).fill("Rafa");
    await page.getByLabel(/Nombre novio\/a 2/i).fill("Sofi");
    await page.locator("#ob_fecha").fill(fechaEventoFutura());

    await page.getByRole("button", { name: /Crear mi viaje/ }).click();

    try {
      await page.waitForURL(/\/panel(\/|$|\?)/, { timeout: 120_000 });
      await expect(page).toHaveURL(/\/panel/);
      return;
    } catch {
      // Sesión no emitida: confirmación obligatoria en Supabase.
    }

    const alerta = page.getByRole("alert");
    await expect(alerta).toBeVisible({ timeout: 30_000 });
    await expect(alerta).toContainText(/confirmar|correo|bandeja|spam/i);

    test.skip(
      true,
      "El proyecto requiere confirmar el correo antes del panel. Desactivá confirmación en Supabase Auth (solo entorno de pruebas) o confirmá el email manualmente."
    );
  });
});
