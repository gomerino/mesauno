import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import AdmZip from "adm-zip";
import { nombresAcompanantes } from "@/lib/invitado-acompanantes";
import { mergeEventoParaPase } from "@/lib/evento-boarding";
import type { Evento, Invitado } from "@/types/database";

const execFileAsync = promisify(execFile);

/** PNG 1×1 mínimo (Apple recomienda iconos mayores; suficiente para demo / desarrollo). */
const MINI_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function sha1(buf: Buffer): string {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

function buildPassJson(invitado: Invitado, evento: Evento | null): Record<string, unknown> {
  const ev = mergeEventoParaPase(invitado, evento);
  const passTypeId =
    process.env.WALLET_PASS_TYPE_IDENTIFIER ?? "pass.com.dreamswedding.invite";
  const teamId = process.env.WALLET_TEAM_IDENTIFIER ?? "TEAMPLACEHLDR";
  const serial = invitado.id;
  const flight = ev.codigo_vuelo;
  const mapAddress = (ev.direccion_completa || "").trim();
  const origRuta = (evento?.boarding_origen_iata || "").trim();
  const destRuta = (evento?.boarding_destino_iata || "").trim();
  const extras = nombresAcompanantes(invitado);

  return {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    serialNumber: serial,
    teamIdentifier: teamId,
    organizationName: "Dreams Airlines",
    description:
      extras.length > 0
        ? `Invitación — ${invitado.nombre_pasajero} & ${extras.join(" & ")}`
        : `Invitación — ${invitado.nombre_pasajero}`,
    logoText: "Dreams",
    foregroundColor: "rgb(255,255,255)",
    backgroundColor: "rgb(13,148,136)",
    labelColor: "rgb(204,251,241)",
    boardingPass: {
      transitType: "PKTransitTypeAir",
      primaryFields: [
        { key: "origin", label: "ORIGEN", value: origRuta || "—" },
        { key: "destination", label: "DESTINO", value: destRuta || "—" },
      ],
      secondaryFields: [
        { key: "passenger", label: "PASAJERO", value: invitado.nombre_pasajero },
        { key: "flight", label: "VUELO", value: flight },
      ],
      auxiliaryFields: [
        { key: "seat", label: "ASIENTO", value: ev.asiento },
        { key: "board", label: "EMBARQUE", value: ev.hora_embarque },
        { key: "address", label: "MAPA", value: mapAddress || "—" },
      ],
      backFields: [
        {
          key: "info",
          label: "Notas",
          value: "Gracias por volar con Dreams Airlines hacia el gran día.",
        },
        ...(extras.length > 0
          ? [
              {
                key: "companions",
                label: "Acompañantes",
                value: extras.join(", "),
              },
            ]
          : []),
      ],
    },
    barcode: {
      format: "PKBarcodeFormatQR",
      message: `invitacion:${invitado.id}`,
      messageEncoding: "iso-8859-1",
    },
  };
}

async function signManifest(
  manifestPath: string,
  outSignaturePath: string
): Promise<void> {
  const cert = process.env.WALLET_SIGNER_CERT_PATH;
  const key = process.env.WALLET_SIGNER_KEY_PATH;
  const wwdr = process.env.WALLET_WWDR_CERT_PATH;
  if (!cert || !key || !wwdr) {
    throw new Error("Faltan rutas de certificados para firmar");
  }
  await execFileAsync("openssl", [
    "smime",
    "-sign",
    "-binary",
    "-in",
    manifestPath,
    "-outform",
    "DER",
    "-out",
    outSignaturePath,
    "-signer",
    cert,
    "-inkey",
    key,
    "-certfile",
    wwdr,
  ]);
}

export type BuildResult = {
  buffer: Buffer;
  signed: boolean;
  warning?: string;
};

export async function buildPkpassForInvitado(
  invitado: Invitado,
  evento: Evento | null
): Promise<BuildResult> {
  const passJson = Buffer.from(JSON.stringify(buildPassJson(invitado, evento)), "utf8");
  const icon = MINI_PNG;
  const icon2x = MINI_PNG;
  const logo = MINI_PNG;

  const files: Record<string, Buffer> = {
    "pass.json": passJson,
    "icon.png": icon,
    "icon@2x.png": icon2x,
    "logo.png": logo,
  };

  const manifest: Record<string, string> = {};
  for (const [name, buf] of Object.entries(files)) {
    manifest[name] = sha1(buf);
  }

  const manifestJson = Buffer.from(JSON.stringify(manifest), "utf8");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pkpass-"));
  const manifestPath = path.join(tmp, "manifest.json");
  const sigPath = path.join(tmp, "signature");

  await fs.writeFile(manifestPath, manifestJson);

  let signed = false;
  try {
    if (
      process.env.WALLET_SIGNER_CERT_PATH &&
      process.env.WALLET_SIGNER_KEY_PATH &&
      process.env.WALLET_WWDR_CERT_PATH
    ) {
      await signManifest(manifestPath, sigPath);
      signed = true;
    }
  } catch {
    signed = false;
  }

  const zip = new AdmZip();
  zip.addFile("pass.json", passJson);
  zip.addFile("manifest.json", manifestJson);
  for (const [name, buf] of Object.entries(files)) {
    if (name !== "pass.json") zip.addFile(name, buf);
  }

  if (signed) {
    const sig = await fs.readFile(sigPath);
    zip.addFile("signature", sig);
  }

  await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});

  const buffer = zip.toBuffer();

  return {
    buffer,
    signed,
    warning: signed
      ? undefined
      : "Sin firma PKCS#7: configura certificados Apple (Pass Type ID + WWDR) y OpenSSL para que Wallet acepte el pase.",
  };
}
