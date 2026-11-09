// Detecta deriva entre el contrato vendorizado y el repositorio de la API.
//
// `contract:check` valida el contrato contra su propio lock; este comando
// compara el contenido real con el origen (`../uni-market-api/openapi.yaml`
// o `OPENAPI_SOURCE`). Sin el origen disponible no falla: en CI no hay
// checkout del repositorio vecino.
//
// Uso:
//   pnpm contract:drift
//   OPENAPI_SOURCE=/ruta/al/openapi.yaml pnpm contract:drift

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockRuta = resolve(root, "openapi", "CONTRACT.lock.json");
const vendorizado = resolve(root, "openapi", "uni-market.yaml");
const origen =
  process.env.OPENAPI_SOURCE ??
  resolve(root, "..", "uni-market-api", "openapi.yaml");

if (!existsSync(origen)) {
  console.log(
    `Origen no disponible (${origen}); se omite la comprobación de deriva.`,
  );
  process.exit(0);
}

const lock = JSON.parse(readFileSync(lockRuta, "utf8"));
const sha = (ruta) =>
  createHash("sha256").update(readFileSync(ruta)).digest("hex");

const shaOrigen = sha(origen);
const shaLocal = sha(vendorizado);

let commitOrigen = null;
try {
  commitOrigen = execFileSync(
    "git",
    ["-C", dirname(origen), "rev-parse", "HEAD"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
} catch {
  commitOrigen = null;
}

if (shaOrigen === shaLocal) {
  console.log(
    "contract:drift OK — el contrato vendorizado es idéntico al origen.",
  );
  if (commitOrigen && commitOrigen !== lock.apiCommit) {
    console.log(
      `  aviso: el origen está en ${commitOrigen.slice(0, 7)} y el lock registra ` +
        `${lock.apiCommit?.slice(0, 7) ?? "n/d"}, pero el contrato no cambió.`,
    );
  }
  process.exit(0);
}

console.error("contract:drift: el contrato de origen difiere del vendorizado.");
console.error(`  origen:       ${origen}`);
console.error(`  sha256 origen: ${shaOrigen}`);
console.error(`  sha256 local:  ${shaLocal}`);
if (commitOrigen) {
  console.error(
    `  commit origen: ${commitOrigen.slice(0, 7)} · lock: ${lock.apiCommit?.slice(0, 7) ?? "n/d"}`,
  );
}
console.error(
  "  Ejecuta `pnpm contract:sync && pnpm api:generate` y commitea ambos.",
);
process.exit(1);
