import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

test.use({ serviceWorkers: "block", deviceScaleFactor: 1, isMobile: false, hasTouch: false });
const output = path.resolve("artifacts/editorial-paris");
const round = process.env.EDITORIAL_ROUND || "segunda";
for (const [width, height] of [[375, 812], [390, 844], [430, 932], [1440, 900]]) {
  test(`portada París y Nuestro viaje ${width}`, async ({ page }) => {
    fs.mkdirSync(output, { recursive: true });
    await page.setViewportSize({ width, height });
    const reference = fs.readFileSync(path.resolve("design-references/editorial-premium/referencia-diseno.png")).toString("base64");
    const size = Math.min(width, 852);
    await page.setContent(`<body style="margin:0;background:#eae6df"><div id="reference" style="width:${size}px;height:${Math.round(size * 1020 / 852)}px;overflow:hidden;margin:auto"><img style="width:100%;display:block" src="data:image/png;base64,${reference}"></div></body>`);
    await page.locator("img").evaluate(async (img: HTMLImageElement) => img.decode());
    const referenceShot = await page.locator("#reference").screenshot({ path: `${output}/referencia-${width}.png` });
    await page.goto("/invitacion/editorial-preview?theme=editorial-premium");
    await page.getByTestId("editorial-hero").locator("img").evaluate(async (img: HTMLImageElement) => img.decode());
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Claudia&Gonzalo");
    await expect(page.getByTestId("editorial-journey")).toContainText("Los invitamos a celebrar esta nueva aventura");
    await expect(page.getByTestId("editorial-journey").getByRole("heading")).toHaveText("Nuestro viaje");
    await expect(page.getByTestId("editorial-journey").locator("p")).toHaveText("Los invitamos a celebrar esta nueva aventura con nosotros. Es nuestro viaje más importante: el día que unimos nuestras rutas y nos elegimos para seguir esta vida juntos.");
    const hero = page.getByTestId("editorial-hero");
    const journey = page.getByTestId("editorial-journey");
    await hero.screenshot({ path: `${output}/${round}-portada-${width}.png` });
    await journey.screenshot({ path: `${output}/${round}-viaje-${width}.png` });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const a = (await hero.boundingBox())!;
    const b = (await journey.boundingBox())!;
    const actual = await page.screenshot({ path: `${output}/${round}-resultado-${width}.png`, fullPage: true, clip: { x: a.x, y: a.y, width: a.width, height: b.y + b.height - a.y } });
    const originalMeta = await sharp(referenceShot).metadata();
    const actualMeta = await sharp(actual).metadata();
    await sharp({ create: { width: size * 2 + 16, height: Math.max(originalMeta.height!, actualMeta.height!), channels: 4, background: "#eae6df" } }).composite([{ input: referenceShot, top: 0, left: 0 }, { input: actual, top: 0, left: size + 16 }]).png().toFile(`${output}/${round}-comparativa-${width}.png`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const button = page.getByRole("button", { name: "Ver detalles y confirmar", exact: true });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#editorial-content")).toBeFocused();
    if (width === 390) {
      await page.getByRole("button", { name: "Confirmar mi asistencia", exact: true }).click();
      await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("confirmado");
      await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
      await page.keyboard.press("Escape");
      const card = page.getByRole("region", { name: "Estado de asistencia" });
      await expect(card).toContainText("Asistencia confirmada");
      await card.screenshot({ path: `${output}/${round}-asistencia-390.png` });
      await page.screenshot({ path: `${output}/${round}-pagina-390.png`, fullPage: true });
    }
  });
}
