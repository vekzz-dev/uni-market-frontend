// Comprueba que el cliente generado no ha derivado del contrato.
// Regenera en un directorio temporal y compara archivo por archivo: no depende
// de git (funciona antes del primer commit) ni modifica el árbol de trabajo.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generado = join(root, 'packages', 'api-client', 'src', 'generado');
const temp = mkdtempSync(join(tmpdir(), 'uni-market-api-check-'));

const archivos = (dir) => {
  const salida = [];
  const recorrer = (actual) => {
    for (const entrada of readdirSync(actual, { withFileTypes: true })) {
      const ruta = join(actual, entrada.name);
      if (entrada.isDirectory()) recorrer(ruta);
      else if (entrada.name.endsWith('.js')) salida.push(relative(dir, ruta));
    }
  };
  recorrer(dir);
  return salida.sort();
};

try {
  execFileSync('node', ['scripts/api-generate.mjs', '--out', temp], { cwd: root, stdio: 'inherit' });

  const diferencias = [];
  for (const carpeta of ['api', 'model']) {
    const esperados = archivos(join(temp, carpeta));
    const actuales = archivos(join(generado, carpeta));

    for (const archivo of esperados) {
      const rutaActual = join(generado, carpeta, archivo);
      let existe = true;
      try {
        statSync(rutaActual);
      } catch {
        existe = false;
      }
      if (!existe) {
        diferencias.push(`falta: ${carpeta}/${archivo}`);
        continue;
      }
      const regenerado = readFileSync(join(temp, carpeta, archivo));
      const commiteado = readFileSync(rutaActual);
      if (!regenerado.equals(commiteado)) diferencias.push(`distinto: ${carpeta}/${archivo}`);
    }

    for (const archivo of actuales) {
      if (!esperados.includes(archivo)) diferencias.push(`sobra: ${carpeta}/${archivo}`);
    }
  }

  if (diferencias.length > 0) {
    console.error('\napi:check FALLÓ — el cliente generado no coincide con el contrato:');
    for (const d of diferencias.slice(0, 20)) console.error(`- ${d}`);
    if (diferencias.length > 20) console.error(`… y ${diferencias.length - 20} más`);
    console.error('\nEjecuta `pnpm api:generate` y commitea el resultado junto al contrato.');
    process.exitCode = 1;
  } else {
    console.log('api:check OK — el cliente generado está al día con el contrato.');
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
