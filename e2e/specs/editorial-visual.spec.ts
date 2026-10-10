import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

test.use({ serviceWorkers: "block", deviceScaleFactor: 1, isMobile: false, hasTouch: false });
const reference = process.env.EDITORIAL_REFERENCE_HTML || path.join(os.homedir(), "Downloads/jurnex-dos-alternativas.html");
const output = path.resolve("artifacts/editorial");
const url = "/invitacion/editorial-preview?theme=editorial-premium";
const originalSelectors = [".hero", ".hero h1", ".content", ".sub", ".stack", ".info", ".section-title", ".ticket", ".tile"];
const currentSelectors = ['[data-testid="editorial-hero"]', "h1", '[class*="_content"]', '[class*="_sub"]', '[class*="_stack"]', '[class*="_info"]', '[class*="_sectionTitle"]', '[class*="_ticket_"]', '[class*="_tile"]'];

for (const width of [390, 1280]) {
  test(`Alternativa A coincide visualmente a ${width}px`, async ({ page }) => {
    test.skip(!fs.existsSync(reference), "Se requiere el HTML de referencia aprobado en EDITORIAL_REFERENCE_HTML.");
    fs.mkdirSync(output, { recursive: true });
    await page.setViewportSize({ width, height: 844 });
    await page.goto(pathToFileURL(reference).href);
    await page.evaluate(async () => { const image = new Image(); image.src = getComputedStyle(document.querySelector(".hero")!).backgroundImage.match(/url\("?([^"\)]+)/)![1]; await image.decode(); });
    await page.screenshot({ path: path.join(output, `original-completo-${width}.png`), fullPage: true });
    // Solo se excluye la herramienta A/B; no se altera el contenido ni el CSS de A.
    await page.addStyleTag({ content: ".top { display: none !important; }" });
    const measure = async (selectors: string[], frame: string) => page.evaluate(({ selectors, frame }) => {
      const parent = document.querySelector(frame)!.getBoundingClientRect();
      return selectors.map((selector) => { const element = document.querySelector(selector)!; const rect = element.getBoundingClientRect(); const css = getComputedStyle(element); return { x: rect.x - parent.x, y: rect.y - parent.y, width: rect.width, height: rect.height, fontSize: css.fontSize, color: css.color, backgroundColor: css.backgroundColor, padding: css.padding, margin: css.margin }; });
    }, { selectors, frame });
    const expected = await measure(originalSelectors, ".frame");
    const original = await page.locator(".frame").screenshot({ path: path.join(output, `original-a-${width}.png`) });
    if (width === 390) {
      await page.getByRole("button", { name: "Confirmar mi asistencia", exact: true }).click();
      await page.screenshot({ path: path.join(output, "original-rsvp-390.png") });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Ver mi pase", exact: true }).click();
      await page.screenshot({ path: path.join(output, "original-pase-390.png") });
    }
    await page.goto(url);
    await page.evaluate(async () => { const image = new Image(); image.src = getComputedStyle(document.querySelector('[data-testid="editorial-hero"]')!).backgroundImage.match(/url\("?([^"\)]+)/)![1]; await image.decode(); });
    const actual = await measure(currentSelectors, '[data-testid="editorial-frame"]');
    const implementation = await page.getByTestId("editorial-frame").screenshot({ path: path.join(output, `implementacion-a-${width}.png`) });
    const first = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const second = await sharp(implementation).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(second.info.width).toBe(first.info.width);
    expect(second.info.height).toBe(first.info.height);
    let different = 0;
    for (let index = 0; index < first.data.length; index += 4) {
      if ([0, 1, 2].some((channel) => Math.abs(first.data[index + channel] - second.data[index + channel]) > 18)) different++;
    }
    const fraction = different / (first.info.width * first.info.height);
    fs.writeFileSync(path.join(output, `medidas-${width}.json`), JSON.stringify({ viewport: { width, height: 844 }, original: expected, implementation: actual, pixelDifferenceAbove18: fraction }, null, 2));
    const w = first.info.width;
    const label = Buffer.from(`<svg width="${w * 2 + 20}" height="44"><rect width="100%" height="100%" fill="#eae6df"/><g font-family="Arial" font-size="16" fill="#25344a"><text x="12" y="28">Prototipo · Alternativa A</text><text x="${w + 32}" y="28">Jurnex · Implementación</text></g></svg>`);
    await sharp({ create: { width: w * 2 + 20, height: first.info.height + 44, channels: 4, background: "#eae6df" } }).composite([{ input: label, top: 0, left: 0 }, { input: original, top: 44, left: 0 }, { input: implementation, top: 44, left: w + 20 }]).png().toFile(path.join(output, `comparativa-${width}.png`));
    // Fondo de respaldo oscuro deliberado: conserva contraste si falla la fotografía.
    expect(actual[0].backgroundColor).toBe("rgb(38, 57, 76)");
    expected[0].backgroundColor = actual[0].backgroundColor;
    expect(actual).toEqual(expected);
    expect(fraction).toBeLessThan(0.01);
    if (width === 390) {
      await page.getByRole("button", { name: "Confirmar mi asistencia", exact: true }).click();
      await page.screenshot({ path: path.join(output, "implementacion-rsvp-390.png") });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Ver mi pase", exact: true }).click();
      await page.screenshot({ path: path.join(output, "implementacion-pase-390.png") });
    }
  });
}
