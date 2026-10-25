// Sincroniza el contrato OpenAPI: copia el spec de origen, lo vendoriza y
// registra su procedencia (commit de la API + hash) en openapi/CONTRACT.lock.json.
//
// Uso:
//   pnpm contract:sync
//   OPENAPI_SOURCE=/ruta/al/openapi.yaml pnpm contract:sync

import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(root, "openapi", "uni-market.yaml");
const desdeEnv = process.env.OPENAPI_SOURCE;
const origen =
  desdeEnv ?? resolve(root, "..", "uni-market-api", "openapi.yaml");

if (!existsSync(origen)) {
  console.error(
    `No encuentro el contrato de origen: ${origen}\n` +
      "Pasa la ruta con OPENAPI_SOURCE=<ruta-al-openapi.yaml>.",
  );
  process.exit(1);
}

mkdirSync(dirname(destino), { recursive: true });
copyFileSync(origen, destino);

const contenido = readFileSync(destino);
const sha256 = createHash("sha256").update(contenido).digest("hex");
const version =
  /^info:[\s\S]*?^\s+version:\s*(.+)$/m
    .exec(contenido.toString("utf8"))?.[1]
    ?.trim() ?? null;

let apiCommit = null;
try {
  apiCommit = execFileSync(
    "git",
    ["-C", dirname(origen), "rev-parse", "HEAD"],
    { encoding: "utf8" },
  ).trim();
} catch {
  // El origen puede no ser un repo git; el hash sigue siendo suficiente.
}

const lock = {
  contract: "openapi/uni-market.yaml",
  // Etiqueta portable: nunca guardamos rutas absolutas de la máquina.
  source: desdeEnv
    ? "OPENAPI_SOURCE (entorno)"
    : "../uni-market-api/openapi.yaml",
  apiCommit,
  apiVersion: version,
  sha256,
  syncedAt: new Date().toISOString(),
};

writeFileSync(
  join(root, "openapi", "CONTRACT.lock.json"),
  `${JSON.stringify(lock, null, 2)}\n`,
);
console.log(`Contrato sincronizado → openapi/uni-market.yaml`);
console.log(
  `  versión: ${version ?? "¿?"} · commit API: ${apiCommit ?? "n/d"}`,
);
console.log(`  sha256:  ${sha256}`);
