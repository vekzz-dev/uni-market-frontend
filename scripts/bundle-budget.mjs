// Presupuesto de rendimiento del bundle web (docs/testing-strategy.md §5).
//
// Mide el JS del build de producción comprimido con gzip y falla si supera el
// presupuesto. El número sale de la tabla de la estrategia: 220 KB gzip para
// el JS inicial de la ruta de catálogo.
//
// Uso:
//   pnpm build:web && pnpm budget:web
//   BUDGET_JS_KB=200 pnpm budget:web

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "apps", "web", "dist", "assets");
const limiteKb = Number(process.env.BUDGET_JS_KB ?? 220);

if (!existsSync(dist)) {
  console.error("Falta apps/web/dist — ejecuta `pnpm build:web` primero.");
  process.exit(1);
}

const archivos = readdirSync(dist)
  .filter((nombre) => nombre.endsWith(".js"))
  .sort();

if (archivos.length === 0) {
  console.error("No hay JS en apps/web/dist/assets; ¿el build falló?");
  process.exit(1);
}

const kb = (bytes) => (bytes / 1024).toFixed(1).padStart(7);
const filas = archivos.map((nombre) => {
  const contenido = readFileSync(join(dist, nombre));
  return {
    nombre,
    crudo: contenido.length,
    gzip: gzipSync(contenido).length,
  };
});

const totalCrudo = filas.reduce((suma, fila) => suma + fila.crudo, 0);
const totalGzip = filas.reduce((suma, fila) => suma + fila.gzip, 0);

console.log("Presupuesto del bundle web (gzip)");
for (const fila of filas) {
  console.log(`  ${fila.nombre}  ${kb(fila.crudo)} KB → ${kb(fila.gzip)} KB`);
}
console.log(
  `  total: ${kb(totalCrudo)} KB → ${kb(totalGzip)} KB · presupuesto ${limiteKb} KB`,
);

if (totalGzip > limiteKb * 1024) {
  console.error(
    `\nPresupuesto superado: ${(totalGzip / 1024).toFixed(1)} KB gzip > ${limiteKb} KB.`,
  );
  console.error(
    "Revisa qué entró en el bundle (dependencia nueva, ruta sin carga diferida) o ajusta el presupuesto con motivo en docs/testing-strategy.md §5.",
  );
  process.exit(1);
}

console.log("\nbudget:web OK — dentro del presupuesto.");
