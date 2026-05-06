import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type CredencialesE2E = { email: string; password: string };

export function credencialesE2E(): CredencialesE2E | null {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

export async function loginConCorreoYClave(
  page: Page,
  credenciales: CredencialesE2E
): Promise<void> {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Acceso al panel" })).toBeVisible();
  await page.getByLabel("Correo electrónico").fill(credenciales.email);
  await page.getByLabel("Contraseña").fill(credenciales.password);
  await page.getByRole("button", { name: "Entrar con contraseña" }).click();
}

export async function esperarPanel(page: Page): Promise<void> {
  await page.waitForURL(/\/panel(\/|$|\?)/, { timeout: 60_000 });
}
