/**
 * Pone en transparente los píxeles "blancos" de un PNG (fondo de export).
 * Uso: node scripts/whiten-to-alpha-png.mjs [ruta-entrada] [ruta-salida] [umbral-0-255]
 */
import sharp from "sharp";
import fs from "fs";

const input = process.argv[2] || "public/brand/jurnex/logos/full/jurnex-logo-full.png";
const output = process.argv[3] || input;
const t = Math.min(255, Math.max(0, parseInt(process.argv[4] || "248", 10)));
/** Todos los canales >= t se consideran fondo blanco */
const FUZZ = 3;

if (!fs.existsSync(input)) {
  console.error("No existe:", input);
  process.exit(1);
}

const img = sharp(input);
const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const p = new Uint8ClampedArray(data);

for (let i = 0; i < p.length; i += 4) {
  const r = p[i];
  const g = p[i + 1];
  const b = p[i + 2];
  if (r >= t - FUZZ && g >= t - FUZZ && b >= t - FUZZ) {
    p[i + 3] = 0;
  }
}

await sharp(Buffer.from(p), { raw: { width: w, height: h, channels: 4 } })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(output + ".tmp");

fs.renameSync(output + ".tmp", output);
console.log("OK", output, "umbral ~", t, "(re-ejecutá con umbral 250–252 si falta blanco en bordes o 242 si se come el sol)");
