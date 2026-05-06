import { expect, test } from "@playwright/test";
import { credencialesE2E, esperarPanel, loginConCorreoYClave } from "../helpers/auth";

test.describe("Login", () => {
  test("credenciales incorrectas muestran mensaje visible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Acceso al panel" })).toBeVisible();

    await page.getByLabel("Correo electrónico").fill("e2e-no-existe@jurnex-e2e.test");
    await page.getByLabel("Contraseña").fill("ClaveIncorrecta123!");

    await page.getByRole("button", { name: "Entrar con contraseña" }).click();

    const aviso = page.getByRole("alert");
    await expect(aviso).toBeVisible({ timeout: 15_000 });
    const texto = await aviso.innerText();
    expect(texto.trim().length).toBeGreaterThan(3);
  });

  test("login correcto lleva al panel", async ({ page }) => {
    test.skip(!credencialesE2E(), "Definí E2E_USER_EMAIL y E2E_USER_PASSWORD (ver e2e/env.example).");
    const cred = credencialesE2E()!;

    await loginConCorreoYClave(page, cred);
    await esperarPanel(page);
    await expect(page).toHaveURL(/\/panel/);
  });
});
