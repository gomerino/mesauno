import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const round = process.env.COVER_ROUND || 'despues';
for (const width of [320, 360, 375, 390, 430]) test(`equilibrio de portada ${width}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/invitacion/editorial-preview?theme=editorial-premium');
  const hero = page.getByTestId('editorial-hero');
  await expect(hero).toBeVisible();
  await hero.locator('img').evaluate(async (img: HTMLImageElement) => img.decode());
  const names = hero.locator('h1 > span');
  await names.first().evaluate(node => { node.textContent = 'Claudia Ibáñez'; });
  await names.last().evaluate(node => { node.textContent = 'Gonzalo Merino'; });
  const message = page.getByTestId('editorial-journey').locator('p');
  const copy = '¡Preparen sus maletas!\n\nLos invitamos a celebrar esta nueva aventura con nosotros. Es nuestro viaje más importante: el día que unimos nuestras rutas.';
  // Datos sintéticos solo en el DOM de prueba, sin escrituras de servicios.
  await message.evaluate((node, text) => {
    node.replaceChildren(...text.split(/(\n\n)/g).map((part, i) => {
      const span = document.createElement('span'); span.textContent = part;
      const existing = document.querySelector('[data-testid="editorial-journey"]');
      if (i % 2) span.className = existing?.getAttribute('data-gap-class') || '';
      return span;
    }));
  }, copy);
  // Usa la clase CSS de los separadores reales cuando exista en la implementación.
  if (round === 'despues') await message.locator('span').nth(1).evaluate(node => {
    const sheet = Array.from(document.styleSheets).flatMap(sheet => { try { return Array.from(sheet.cssRules); } catch { return []; } });
    const rule = sheet.find(rule => rule.cssText.includes('messageGap')) as CSSStyleRule | undefined;
    if (rule) node.className = rule.selectorText.slice(1);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (round === 'despues') {
    const heights = await names.evaluateAll(nodes => nodes.filter((_, i) => i !== 1).map(node => node.getBoundingClientRect().height));
    expect(Math.abs(heights[0] - heights[1])).toBeLessThan(2);
  }
  const button = hero.getByRole('button', { name: 'Ver detalles y confirmar' });
  await expect(button).toBeVisible();
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const output = `artifacts/editorial-cover-balance/${info.project.name}`;
  fs.mkdirSync(output, { recursive: true });
  await page.screenshot({ path: `${output}/${round}-${width}.png` });
  await button.click();
  await expect(page.locator('#editorial-content')).toBeFocused();
});
