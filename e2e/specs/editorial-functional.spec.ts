import { expect, test } from "@playwright/test";
test.use({ serviceWorkers: "block" });

const url = "/invitacion/editorial-preview?theme=editorial-premium&contracts=1";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.route("**/*.supabase.co/**", (route) => route.abort());
  await page.routeWebSocket(/\/realtime\//, (socket) => socket.close());
});

test("RSVP maneja error, éxito y edición; dietas conserva asistencia", async ({ page }) => {
  const payloads: unknown[] = [];
  await page.route("**/api/rsvp", async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({ status: payloads.length === 1 ? 500 : 200, json: payloads.length === 1 ? { error: "No se pudo guardar. Intenta de nuevo." } : { ok: true } });
  });
  await page.goto(url);
  await page.getByRole("button", { name: "Confirmar mi asistencia" }).click();
  await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("confirmado");
  await page.getByRole("combobox", { name: "Preferencia alimentaria (opcional)", exact: true }).selectOption("Sin gluten");
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("No se pudo guardar. Intenta de nuevo.");
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await expect(page.getByRole("status")).toContainText("asistencia quedó confirmada");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Dietas y preferencias" }).click();
  await expect(page.getByRole("combobox", { name: "Preferencia alimentaria (opcional)", exact: true })).toHaveValue("Sin gluten");
  await page.getByRole("combobox", { name: "Preferencia alimentaria (opcional)", exact: true }).selectOption("Otra");
  await page.getByLabel("Otras preferencias").fill("Sin gluten, sin mariscos");
  await page.getByRole("button", { name: "Guardar preferencias" }).click();
  await expect(page.getByRole("status")).toContainText("preferencias quedaron guardadas");
  expect(payloads.at(-1)).toEqual({ invitadoId: "00000000-0000-4000-8000-00000000d001", rsvp_estado: "confirmado", restricciones_alimenticias: "Sin gluten, sin mariscos" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Modificar mi respuesta", exact: true }).click();
  await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("declinado");
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ver mi pase", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("No asistiré");
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
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Cómo llegar" }).click();
  await expect(page.getByRole("link", { name: "Abrir en mapas" })).toHaveAttribute("href", /google.com\/maps/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Regalos", exact: true }).click();
  await expect(page.getByRole("link", { name: "Abrir lista de regalos" })).toHaveAttribute("href", "https://example.com/regalos");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Confirmar mi asistencia" }).click();
  await page.getByRole("combobox", { name: "Asistencia", exact: true }).selectOption("confirmado");
  await page.getByRole("button", { name: "Guardar mi respuesta" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Nuestra música" }).click();
  await page.getByPlaceholder(/Busca/i).fill("Nuestra canción");
  await page.getByRole("button", { name: /Agregar|Proponer|Sugerir/i }).last().click();
  await expect(page.getByText("Canción enviada para aprobación", { exact: true })).toBeVisible();
  expect(songPayload?.invitacion_token).toBe("editorial-preview");
  expect(songPayload?.spotify_id).toBe("test123");
});

test("PhotoUpload inline sube por contrato actual y actualiza galería", async ({ page }) => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  await page.route("**/_next/image?*", (route) => route.fulfill({ contentType: "image/png", body: png }));
  let uploadBody = "";
  await page.route("**/api/invitacion/fotos", async (route) => {
    uploadBody = route.request().postDataBuffer()?.toString() || "";
    await route.fulfill({ json: { ok: true, foto: { id: "foto-demo", evento_id: "00000000-0000-4000-8000-00000000d002", invitado_id: null, storage_path: "demo/foto.jpg", created_at: "2027-02-20T16:00:00Z" } } });
  });
  await page.goto(`${url}&phase=durante`);
  await page.locator('input[type="file"]').setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("status")).toContainText("Tu foto ya está en el álbum");
  expect(uploadBody).toContain("editorial-preview");
  expect(uploadBody).toContain('filename="foto.jpg"');
  await page.getByRole("button", { name: "Ver fotos del evento", exact: true }).first().click();
  await expect(page.getByRole("img", { name: "Foto compartida por un invitado" })).toBeVisible();
});
