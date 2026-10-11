import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

test.use({ deviceScaleFactor: 1, isMobile: false, hasTouch: false, serviceWorkers: "block" });
const output = path.resolve("artifacts/editorial-etapa2");
for (const width of [390, 430]) test(`información y pase a ${width}px`, async ({ page }) => {
  fs.mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width, height: 932 });
  await page.goto("/invitacion/editorial-preview?theme=editorial-premium");
  await page.evaluate(() => document.fonts.ready);
  const details = page.getByTestId("editorial-details");
  await expect(details).toContainText("20 de febrero de 2027");
  await expect(details).toContainText("12:00 h");
  await expect(details).toContainText("Invitado especial");
  await expect(details).not.toContainText("Camino de ejemplo");
  await expect(details.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=Buin%2CChile");
  await expect(details.locator("canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const section = await details.screenshot();
  const bounds = await details.boundingBox();
  const left = Math.round(bounds!.x);
  const sectionMeta = await sharp(section).metadata();
  const actual = await sharp(section).extend({ left, right: width - sectionMeta.width! - left, top: 0, bottom: 0, background: "#faf7f1" }).png().toBuffer();
  await sharp(actual).toFile(`${output}/resultado-${width}.png`);
  const reference = await sharp("design-references/editorial-premium/referencia-diseno.png").extract({ left: 0, top: 1025, width: 852, height: 593 }).resize(width).png().toBuffer();
  await sharp(reference).toFile(`${output}/referencia-${width}.png`);
  const meta = await sharp(actual).metadata();
  await sharp({ create: { width: width * 2 + 16, height: Math.max(meta.height!, Math.round(593 * width / 852)), channels: 4, background: "#eae6df" } }).composite([{ input: reference, left: 0, top: 0 }, { input: actual, left: width + 16, top: 0 }]).png().toFile(`${output}/comparativa-${width}.png`);
  await expect(page.getByRole("button", { name: "Ver pase completo" })).toHaveCount(0);
  await page.goto("/invitacion/editorial-preview?theme=editorial-premium&boarding=0");
  await expect(page.getByRole("region", { name: "Pase de embarque", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ver pase completo" })).toHaveCount(0);

});


test("check-in conserva fase, token y descarga del componente existente", async ({ page }) => {
  await page.route("**/api/**", route => route.abort());
  await page.route("**/*.supabase.co/**", route => route.abort());
  await page.routeWebSocket(/\/realtime\//, socket => socket.close());
  const url = "/invitacion/editorial-preview?theme=editorial-premium&contracts=1";
  await page.goto(url);
  await expect(page.getByTestId("editorial-details").locator("canvas")).toHaveCount(0);
  await page.goto(`${url}&phase=durante`);
  const details = page.getByTestId("editorial-details");
  const checkIn = page.getByRole("region", { name: "Tu ingreso al evento" });
  await expect(checkIn.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Ampliar QR" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("dialog").getByRole("button", { name: "Guardar imagen del QR" }).click();
  expect((await download).suggestedFilename()).toBe("check-in-mesa-uno.png");
  await expect(page.getByRole("dialog").locator("canvas")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Ampliar QR" })).toBeFocused();
  await page.goto(`${url}&phase=durante&boarding=0`);
  await expect(page.getByRole("button", { name: "Ver pase completo" })).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.goto(`${url}&phase=despues`);
  await expect(page.locator("canvas")).toHaveCount(0);
});
