import { expect, test } from "@playwright/test";
import { INVITACION_THEMES, INVITACION_THEME_IDS, isEditorialDevelopmentPreview, resolveInvitacionThemeId } from "../../src/lib/invitacion-theme";
import { editorialEventPhase } from "../../src/lib/editorial-event-phase";

test.use({ serviceWorkers: "block" });

const url = "/invitacion/editorial-preview?theme=editorial-premium";

test("registro público y fixture reservado a desarrollo", () => {
  expect(INVITACION_THEME_IDS).toContain("editorial-premium");
  expect(INVITACION_THEMES.map((theme) => theme.id)).toEqual(["legacy", "soft-aviation", "jurnex-aviation", "editorial-premium"]);
  expect(isEditorialDevelopmentPreview("editorial-preview", "editorial-premium", "development")).toBe(true);
  for (const env of ["production", "test", undefined]) expect(isEditorialDevelopmentPreview("editorial-preview", "editorial-premium", env)).toBe(false);
  expect(isEditorialDevelopmentPreview("real-token", "editorial-premium", "development")).toBe(false);
  expect(isEditorialDevelopmentPreview("editorial-preview", undefined, "development")).toBe(false);
  expect(resolveInvitacionThemeId({ theme_id: "editorial-premium" })).toBe("editorial-premium");
  expect(resolveInvitacionThemeId({ theme_id: "legacy" }, "premium")).toBe("soft-aviation");
  expect(resolveInvitacionThemeId({ evento: { theme_id: "jurnex-aviation" }, invitado: { theme_id: "soft-aviation" } })).toBe("jurnex-aviation");
  expect(resolveInvitacionThemeId({ theme_id: "soft-aviation" }, "editorial-premium")).toBe("editorial-premium");
  expect(resolveInvitacionThemeId({ evento: { theme_id: "editorial-premium" }, invitado: { theme_id: "legacy" } })).toBe("editorial-premium");
  expect(resolveInvitacionThemeId({ evento: { theme_id: "editorial-premium" }, invitado: { theme_id: "legacy" } }, "legacy")).toBe("legacy");
  for (const id of ["legacy", "soft-aviation", "jurnex-aviation"] as const) {
    expect(resolveInvitacionThemeId({ evento: { theme_id: id }, invitado: { theme_id: "editorial-premium" } })).toBe(id);
  }
  expect(resolveInvitacionThemeId({ theme_id: "desconocido" })).toBe("legacy");
});

test("fases por fecha en Chile, incluyendo medianoche y fecha inválida", () => {
  expect(editorialEventPhase("2027-02-20", new Date("2027-02-20T02:59:59Z"))).toBe("antes");
  expect(editorialEventPhase("2027-02-20", new Date("2027-02-20T03:00:00Z"))).toBe("durante");
  expect(editorialEventPhase("2027-02-20", new Date("2027-02-21T03:00:00Z"))).toBe("despues");
  expect(editorialEventPhase(null)).toBe("antes");
  expect(editorialEventPhase("2027-02-31")).toBe("antes");
});

test("demo segura, diálogos, foco y opciones de fase", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (req) => { if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method())) mutations.push(req.url()); });
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Claudia&Gonzalo");
  const cta = page.getByRole("button", { name: "Confirmar mi asistencia", exact: true });
  await cta.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("confirmado");
  await expect(page.getByRole("combobox", { name: /Preferencia alimentaria/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await expect(page.getByRole("status")).toContainText("Solo en esta demostración");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Modificar mi respuesta", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Ver mi pase", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Confirmado");
  await page.keyboard.press("Escape");
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto(`${url}&phase=durante`);
  await expect(page.getByRole("button", { name: "Compartir fotos", exact: true })).toBeVisible();
  await page.goto(`${url}&phase=despues`);
  await expect(page.getByRole("heading", { name: "Álbum de recuerdos", exact: true })).toBeVisible();
  await page.goto(`${url}&boarding=0`);
  await expect(page.getByRole("button", { name: "Ver mi pase", exact: true })).toHaveCount(0);
  expect(mutations).toEqual([]);
});

test("token reservado sin override devuelve 404", async ({ page }) => {
  const response = await page.goto("/invitacion/editorial-preview");
  expect(response?.status()).toBe(404);
});


test("portada permite continuar con teclado y movimiento reducido en cada etapa", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [phase, label] of [["antes", "Ver la invitación"], ["durante", "Ver y compartir fotos"], ["despues", "Ver los recuerdos"]]) {
    await page.goto(`${url}&phase=${phase}`);
    const button = page.getByRole("button", { name: label, exact: true });
    await expect(button).toBeVisible();
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#editorial-content")).toBeFocused();
    await expect.poll(() => page.locator("#editorial-content").evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(100);
  }
});
