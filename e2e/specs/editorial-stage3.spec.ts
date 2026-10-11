import { test, expect } from "@playwright/test";
import fs from "node:fs";
const url = "/invitacion/editorial-preview?theme=editorial-premium";
test.use({ deviceScaleFactor: 1, isMobile: false, screenshot: "off", video: "off", trace: "off" });
for (const [width, height] of [[390,844],[430,932],[1440,900]]) test(`etapa 3 responsive ${width}`, async ({ page }) => {
  fs.mkdirSync("artifacts/editorial-etapa3", { recursive: true });
  await page.setViewportSize({width,height});
  for (const phase of ["antes","durante","despues"]) {
    await page.goto(`${url}&phase=${phase}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("button", {name:"Ver pase completo"})).toHaveCount(0);
    await expect(page.getByText("Los detalles de tu invitación, siempre contigo.")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (phase !== "despues") {
      const grid = page.getByRole("navigation", {name:"Más detalles"});
      await expect(grid.locator("button,a")).toHaveCount(5);
      for (const name of ["Programa del evento","Regalos","Música","Fotos del evento"]) {
        await grid.getByRole("button",{name,exact:true}).click();
        if (name === "Fotos del evento") { await expect(page.locator("#editorial-album")).toBeFocused(); await expect(page.getByRole("dialog")).toHaveCount(0); continue; }
        await expect(page.getByRole("dialog")).toBeVisible();
        if(name === "Dietas") await expect(page.getByRole("combobox",{name:/Preferencia alimentaria/})).toBeVisible();
        await page.keyboard.press("Escape");
      }
    }
    await expect(page.getByTestId("editorial-hero")).toContainText("20 de febrero de 2027");
    await expect(page.getByTestId("editorial-details")).toContainText("20 de febrero de 2027");
    if (phase !== "durante") await expect(page.getByRole("region", {name:"Pase de embarque",exact:true})).toContainText("20 FEB 2027");
    else await expect(page.getByRole("region", {name:"Pase de embarque",exact:true})).toHaveCount(0);
    const detailsY = (await page.getByTestId("editorial-details").boundingBox())!.y;
    const albumY = (await page.locator("#editorial-album").boundingBox())!.y;
    if(phase !== "antes") expect(albumY).toBeLessThan(detailsY);
    else expect(albumY).toBeGreaterThan(detailsY);
    await expect(page.locator("#editorial-album")).toHaveCount(1);
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path:`artifacts/editorial-etapa3/${phase}-${width}.png`,fullPage:true});
  }
});
test("Editorial Premium no ofrece tarjeta Dietas", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("button",{name:"Dietas",exact:true})).toHaveCount(0);
});


test("álbum muestra conexión, error y conserva error de subida", async ({ page }) => {
  await page.route("**/*.supabase.co/**",route=>route.abort());
  let closeSocket: (() => void) | undefined;
  await page.routeWebSocket(/\/realtime\//,socket=>{ closeSocket = () => socket.close(); });
  await page.route("**/api/invitacion/fotos",route=>route.fulfill({status:500,json:{error:"No se pudo subir la foto"}}));
  await page.goto(`${url}&phase=durante&contracts=1`);
  await expect(page.getByText("Aún no hay fotos",{exact:true})).toBeVisible();
  await expect(page.getByText("Conectando con el álbum…",{exact:true})).toBeVisible();
  await expect.poll(() => Boolean(closeSocket)).toBe(true);
  closeSocket!();
  await expect(page.getByText(/No pudimos conectar las actualizaciones/)).toBeVisible();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  await page.locator('input[type="file"]').setInputFiles({name:"foto.png",mimeType:"image/png",buffer:png});
  await expect(page.getByRole("region",{name:"Fotos del evento",exact:true}).getByRole("alert")).toContainText("No se pudo subir");
  await expect(page.getByRole("button",{name:"Compartir mis fotos",exact:true})).toBeEnabled();
});


test("álbum único descarta eventos de subida de otro evento",async({page})=>{
  await page.route("**/api/**",route=>route.abort());
  await page.route("**/*.supabase.co/**",route=>route.abort());
  await page.routeWebSocket(/\/realtime\//,socket=>socket.close());
  await page.goto(`${url}&phase=durante&contracts=1`);
  await page.getByRole("navigation",{name:"Más detalles"}).getByRole("button",{name:"Fotos del evento",exact:true}).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent("jurnex-invitacion-foto-subida",{detail:{foto:{id:"prueba-otro-evento",evento_id:"evento-ajeno",storage_path:"test/ajeno.jpg",created_at:"2027-02-20T16:00:00Z"}}})));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.getByText("Aún no hay fotos",{exact:true})).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent("jurnex-invitacion-foto-subida",{detail:{foto:{id:"prueba-mismo-evento",evento_id:"00000000-0000-4000-8000-00000000d002",storage_path:"test/propio.jpg",created_at:"2027-02-20T16:00:00Z"}}})));
  await expect(page.getByRole("img",{name:"Foto compartida por un invitado"})).toHaveCount(1);
});

test.describe("templates existentes, solo lectura", () => {
for(const theme of ["legacy","soft-aviation","jurnex-aviation"]) test(`regresión de lectura ${theme}`,async({page})=>{
  test.skip(!process.env.E2E_INVITACION_READ_TOKEN,"Requiere token de invitación para revisión de lectura.");
  await page.route("**/api/**",route=>route.abort());
  await page.route("**/*.supabase.co/**",route=>route.abort());
  await page.routeWebSocket(/\/realtime\//,socket=>socket.close());
  const errors: string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  const response = await page.goto(`/invitacion/${process.env.E2E_INVITACION_READ_TOKEN}?theme=${theme}`);
  expect(response?.status()).toBe(200);
  if (theme === "legacy") await expect(page.locator("main")).toBeVisible();
  else {
    const navigation = page.getByRole("navigation",{name:"Secciones de la invitación"}).last();
    await expect(navigation).toBeVisible();
    for (const name of ["Carta de invitación", "Bitácora de fotos", "Pase de abordaje"]) {
      const button = navigation.getByRole("button",{name,exact:true});
      if (await button.count()) { await button.click(); await expect(button).toHaveAttribute("aria-current","page"); }
    }
  }
  await expect(page.getByTestId("editorial-frame")).toHaveCount(0);
  expect(errors).toEqual([]);
});

});
