import { expect, test } from "@playwright/test";
import { credencialesE2E, esperarPanel, loginConCorreoYClave } from "../helpers/auth";
import { guardarInvitadoDePrueba, nombreInvitadoUnico } from "../helpers/invitados";

test.describe("Agregar invitados", () => {
  test.beforeEach(({ }, info) => {
    if (!credencialesE2E()) {
      info.skip(true, "Configura E2E_USER_EMAIL y E2E_USER_PASSWORD.");
    }
  });

  test("añade un invitado desde Pasajeros", async ({ page }) => {
    const cred = credencialesE2E()!;
    await loginConCorreoYClave(page, cred);
    await esperarPanel(page);

    await page.goto("/panel/pasajeros");
    await expect(page.getByRole("heading", { name: /Tus Pasajeros/i })).toBeVisible({ timeout: 30_000 });

    const nombre = nombreInvitadoUnico();
    await guardarInvitadoDePrueba(page, nombre);

    await expect(page.getByText(nombre).first()).toBeVisible();
  });
});
