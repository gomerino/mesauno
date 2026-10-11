import { expect, test } from "@playwright/test";
import fs from "node:fs";

for (const width of [320, 360, 375, 390, 430]) {
  test(`responsive nombres y programa ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/invitacion/editorial-preview?theme=editorial-premium');
    await page.evaluate(() => document.fonts.ready);
    const output = `artifacts/editorial-responsive/${info.project.name}`;
    fs.mkdirSync(output, { recursive: true });
    const names = page.getByRole('heading', { level: 1 }).locator('span');
    await expect(names).toHaveCount(3);
    const lines = async () => names.evaluateAll(nodes => nodes.map(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      return range.getClientRects().length;
    }));
    expect(await lines()).toEqual([1, 1, 1]);
    await page.getByTestId('editorial-hero').screenshot({ path: `${output}/portada-${width}.png` });
    // Solo sustituye texto en el DOM de prueba; nunca cambia datos del evento.
    await names.first().evaluate(node => { node.textContent = 'María Alejandra Fernández'; });
    await names.last().evaluate(node => { node.textContent = 'Maximiliano González'; });
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('overflow-wrap', 'normal');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByTestId('editorial-hero').screenshot({ path: `${output}/nombres-largos-${width}.png` });
    await page.getByRole('button', { name: 'Programa del evento' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('h3').first().evaluate(node => { node.textContent = 'Comunicaciones de cabina'; });
    await dialog.locator('h3').nth(1).evaluate(node => { node.textContent = 'Bienvenida de los anfitriones y celebración de nuestro matrimonio'; });
    await expect(dialog.locator('h3').first()).toHaveCSS('overflow-wrap', 'normal');
    const metrics = await dialog.evaluate(node => {
      const title = node.querySelector('h3')!;
      const heading = node.querySelector('h2')!.getBoundingClientRect();
      const close = node.querySelector('button')!.getBoundingClientRect();
      return { overflow: node.scrollWidth > node.clientWidth, lines: title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight), overlap: heading.right > close.left && heading.top < close.bottom && heading.bottom > close.top };
    });
    expect(metrics.overflow).toBe(false);
    expect(metrics.lines).toBeLessThanOrEqual(3);
    expect(metrics.overlap).toBe(false);
    await dialog.screenshot({ path: `${output}/programa-${width}.png` });
    await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}
