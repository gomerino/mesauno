import { expect, test } from "@playwright/test";
test.use({ serviceWorkers: "block" });

const url = "/invitacion/editorial-preview?theme=editorial-premium&contracts=1";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.route("**/*.supabase.co/**", (route) => route.abort());
  await page.routeWebSocket(/\/realtime\//, (socket) => socket.close());
});

test("RSVP maneja error, éxito y edición sin editar nombre ni dietas", async ({ page }) => {
  const payloads: unknown[] = [];
  await page.route("**/api/rsvp", async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({ status: payloads.length === 1 ? 500 : 200, json: payloads.length === 1 ? { error: "No se pudo guardar. Intenta de nuevo." } : { ok: true } });
  });
  await page.goto(url);
  await page.getByRole("button", { name: "Confirmar mi asistencia" }).click();
  await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("confirmado");
  await expect(page.getByRole("dialog").getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toContainText("Invitado especial");
  await expect(page.getByRole("combobox", { name: /Preferencia alimentaria/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("No se pudo guardar. Intenta de nuevo.");
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await expect(page.getByRole("status")).toContainText("asistencia quedó confirmada");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Dietas y preferencias" })).toHaveCount(0);
  const stateCard = page.getByRole("region", { name: "Estado de asistencia" });
  await expect(stateCard).toContainText("Asistencia confirmada");
  await expect(stateCard).toContainText("Invitado especial");
  await stateCard.getByRole("button", { name: "Modificar mi respuesta", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("textbox")).toHaveCount(0);
  await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("declinado");
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Pase de embarque", exact: true })).toContainText("No asistiré");
});

test("programa, mapas, regalos y música usan módulos y contratos existentes", async ({ page }) => {
  await page.route("**/api/rsvp", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/musica/lista?*", (route) => route.fulfill({ json: { items: [], sugerencias_usadas: 0, sugerencias_max: 5 } }));
  await page.route("**/api/musica/estado*", (route) => route.fulfill({ json: { modo_dj: false } }));
  await page.route("**/api/spotify/search?*", (route) => route.fulfill({ json: { tracks: [{ uri: "spotify:track:test123", id: "test123", name: "Nuestra canción", artists: "Artista demo", album: "Álbum", imageUrl: null }] } }));
  let songPayload: Record<string, string> | undefined;
  await page.route("**/api/musica/agregar", (route) => { songPayload = route.request().postDataJSON(); return route.fulfill({ json: { ok: true } }); });
  await page.goto(url);
  await page.getByRole("button", { name: "Programa del evento" }).click();
  await expect(page.getByRole("dialog")).toContainText("Ceremonia");
  await expect(page.getByRole("heading", { name: "Nuestro gran día" })).toBeVisible();
  await expect(page.getByRole("dialog").locator("time")).toHaveText(["12:00", "13:00", "15:00"]);
  await expect(page.getByRole("dialog")).toContainText("Celebremos juntos");
  await expect(page.getByRole("dialog")).toContainText("Buin");
  await page.getByRole("dialog").screenshot({ path: `artifacts/editorial/programa-${test.info().project.name}.png` });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Fecha, hora y ubicación" })).toBeVisible();
  await expect(page.locator("#editorial-place")).toContainText("Salón Jardín Esperanza");
  await expect(page.locator("#editorial-place")).not.toContainText("Camino de ejemplo 123");
  await expect(page.getByRole("button", { name: "Ver lugar y horario" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Más detalles" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cómo llegar" }).first()).toHaveAttribute("href", /google.com\/maps/);
  await expect(page.getByRole("link", { name: "Cómo llegar" }).first()).toHaveAttribute("target", "_blank");
  await page.getByRole("button", { name: "Regalos", exact: true }).click();
  await expect(page.getByRole("link", { name: "Abrir lista de regalos" })).toHaveAttribute("href", "https://example.com/regalos");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Confirmar mi asistencia" }).click();
  await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("confirmado");
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Música" }).click();
  await page.getByPlaceholder(/Busca/i).fill("Nuestra canción");
  await page.getByRole("button", { name: /Agregar|Proponer|Sugerir/i }).last().click();
  await expect(page.getByText("Canción enviada para aprobación", { exact: true })).toBeVisible();
  expect(songPayload?.invitacion_token).toBe("editorial-preview");
  expect(songPayload?.spotify_id).toBe("test123");
});

for (const phase of ["durante", "despues"]) test(`PhotoUpload inline y álbum ${phase}`, async ({ page }) => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  await page.route("**/_next/image?*", (route) => route.fulfill({ contentType: "image/png", body: png }));
  let uploadBody = "";
  await page.route("**/api/invitacion/fotos", async (route) => {
    uploadBody = route.request().postDataBuffer()?.toString() || "";
    await route.fulfill({ json: { ok: true, foto: { id: "foto-demo", evento_id: "00000000-0000-4000-8000-00000000d002", invitado_id: null, storage_path: "demo/foto.jpg", created_at: "2027-02-20T16:00:00Z" } } });
  });
  await page.route("**/rest/v1/rpc/programa_con_fotos_ventanas_publica", (route) => route.fulfill({ json: { ok: true, evento_id: "00000000-0000-4000-8000-00000000d002", fecha_evento: "2027-02-20", hitos: [{ hito_id: "demo-hito", orden: 0, hora: "12:00:00", titulo: "Ceremonia", fotos: [{ id: "foto-demo", storage_path: "demo/foto.jpg", created_at: "2027-02-20T16:00:00Z" }] }] } }));
  await page.goto(`${url}&phase=${phase}`);
  await page.locator('input[type="file"]').setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("status")).toContainText("Tu foto ya está en el álbum");
  expect(uploadBody).toContain("editorial-preview");
  expect(uploadBody).toContain('filename="foto.jpg"');
  await expect(page.getByText("Hay viajes que cambian la vida.", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Fotos del evento" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveCount(phase === "despues" ? 1 : 2);
  await expect(page.getByRole("button", { name: "Programa del evento" })).toHaveCount(phase === "despues" ? 0 : 1);
  await expect(page.getByRole("img", { name: "Foto compartida por un invitado" })).toBeVisible();
  await expect(page.getByRole("region", { name: "12:00 · Ceremonia", exact: true }).getByRole("img")).toBeVisible();
  if (phase === "despues") {
    await expect(page.getByRole("heading", { name: /Lugar y horario|Tu viaje comienza aquí|Más detalles/ })).toHaveCount(0);
    await page.getByRole("img", { name: "Foto compartida por un invitado" }).click();
    await page.route("**/storage/v1/object/public/fotos_eventos/demo/foto.jpg", (route) => route.fulfill({ status: 500 }));
    await page.getByRole("button", { name: "Descargar foto", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText("No pudimos descargar");
    await page.route("**/storage/v1/object/public/fotos_eventos/demo/foto.jpg", (route) => route.fulfill({ contentType: "image/png", body: png }));
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar foto", exact: true }).click();
    expect((await download).suggestedFilename()).toBe("foto.jpg");
    await expect(page.getByRole("dialog").getByRole("status")).toContainText("Descarga iniciada");
  }
});
