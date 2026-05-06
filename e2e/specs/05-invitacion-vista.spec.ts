import { expect, test } from "@playwright/test";
import { credencialesE2E, esperarPanel, loginConCorreoYClave } from "../helpers/auth";
import { guardarInvitadoDePrueba, nombreInvitadoUnico } from "../helpers/invitados";

test.describe("Invitación (vista previa en panel)", () => {
  test.beforeEach(({ }, info) => {
    if (!credencialesE2E()) {
      info.skip(true, "Configura E2E_USER_EMAIL y E2E_USER_PASSWORD.");
    }
  });

  test("vista previa carga el iframe de la invitación pública", async ({ page }) => {
    const cred = credencialesE2E()!;
    await loginConCorreoYClave(page, cred);
    await esperarPanel(page);

    await page.goto("/panel/pasajeros");
    await expect(page.getByRole("heading", { name: /Tus Pasajeros/i })).toBeVisible({ timeout: 30_000 });

    const listaVacia = page.getByText("Lista vacía");
    if (await listaVacia.isVisible().catch(() => false)) {
      await guardarInvitadoDePrueba(page, nombreInvitadoUnico());
    }

    await page.goto("/panel/pasajeros/vista");
    await expect(page.getByRole("heading", { name: "Vista previa" })).toBeVisible({ timeout: 30_000 });

    const iframe = page.frameLocator('iframe[title*="Invitación"]');
    await expect(iframe.locator("body")).toBeVisible({ timeout: 90_000 });

    const src = await page.locator('iframe[title*="Invitación"]').getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).toMatch(/invitacion\//);
    expect(src).toMatch(/previewFromPanel=/);
  });
});
