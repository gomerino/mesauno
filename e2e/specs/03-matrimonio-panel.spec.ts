import { expect, test } from "@playwright/test";
import { credencialesE2E, esperarPanel, loginConCorreoYClave } from "../helpers/auth";

test.describe("Creación del matrimonio (evento en panel)", () => {
  test.beforeEach(({ }, info) => {
    if (!credencialesE2E()) {
      info.skip(true, "Configura E2E_USER_EMAIL y E2E_USER_PASSWORD para este flujo.");
    }
  });

  test("existe ficha de viaje: sección Tu viaje accesible", async ({ page }) => {
    const cred = credencialesE2E()!;
    await loginConCorreoYClave(page, cred);
    await esperarPanel(page);

    await page.goto("/panel/viaje");
    await expect(page.getByRole("heading", { name: "Tu viaje" })).toBeVisible({ timeout: 30_000 });
  });
});
