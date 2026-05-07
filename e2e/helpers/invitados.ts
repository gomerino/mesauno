import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const NOMBRE_PRUEBA_PREFIX = "E2E";

export async function abrirModalAnadirInvitado(page: Page): Promise<void> {
  const mobileAdd = page.locator("#invitados-btn-add");
  if (await mobileAdd.isVisible().catch(() => false)) {
    await mobileAdd.click();
  } else {
    await page.getByRole("button", { name: /^Añadir$/ }).first().click();
  }
  await expect(page.getByRole("heading", { name: /Añadir invitado|Editar persona/ })).toBeVisible();
}

export async function guardarInvitadoDePrueba(
  page: Page,
  nombre: string
): Promise<void> {
  await abrirModalAnadirInvitado(page);
  const dialogo = page.getByRole("dialog");
  await dialogo.getByRole("textbox").first().fill(nombre);
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText(nombre).first()).toBeVisible({ timeout: 30_000 });
}

export function nombreInvitadoUnico(): string {
  return `${NOMBRE_PRUEBA_PREFIX} ${Date.now()}`;
}
