// Regenera el cliente HTTP desde openapi/uni-market.yaml.
//
// Reglas (docs/api-integration.md §1):
// - El código de `<out>/{api,model}` lo escribe SOLO este script.
// - `src/generado/ApiClient.js` es el transporte propio (fetch) y queda excluido
//   de la generación: el generador produce el suyo con superagent y lo descartamos.
// - El generador emite imports sin extensión (estilo Babel). Node ESM no los
//   resuelve, así que se normalizan a `.js` después de copiar.
//
// Uso:
//   node scripts/api-generate.mjs                 # escribe en packages/api-client/src/generado
//   node scripts/api-generate.mjs --out <dir>     # escribe en otro destino (lo usa api:check)

import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = join(root, 'openapi', 'uni-market.yaml');

const indiceOut = process.argv.indexOf('--out');
const destino = indiceOut !== -1 ? resolve(process.argv[indiceOut + 1]) : join(root, 'packages', 'api-client', 'src', 'generado');

if (!existsSync(spec)) {
  console.error('Falta openapi/uni-market.yaml — ejecuta `pnpm contract:sync` primero.');
  process.exit(1);
}

const temp = mkdtempSync(join(tmpdir(), 'uni-market-api-client-'));
// npx re-parte argumentos con espacios: generamos desde una copia con ruta segura.
const specSeguro = join(temp, 'spec.yaml');

try {
  copyFileSync(spec, specSeguro);
  console.log(`Generando cliente desde el contrato → ${destino}`);
  execFileSync(
    'npx',
    [
      '-y',
      '@openapitools/openapi-generator-cli@2.41.0',
      'generate',
      '-i',
      specSeguro,
      '-g',
      'javascript',
      '-o',
      temp,
      '--additional-properties=useES6=true,usePromises=true,projectName=uni-market-api-client',
    ],
    { stdio: 'inherit', cwd: root },
  );

  const origenApi = join(temp, 'src', 'api');
  const origenModel = join(temp, 'src', 'model');
  if (!existsSync(origenApi) || !existsSync(origenModel)) {
    throw new Error('El generador no produjo src/api y src/model; revisa la salida anterior.');
  }

  rmSync(join(destino, 'api'), { recursive: true, force: true });
  rmSync(join(destino, 'model'), { recursive: true, force: true });
  mkdirSync(destino, { recursive: true });
  cpSync(origenApi, join(destino, 'api'), { recursive: true });
  cpSync(origenModel, join(destino, 'model'), { recursive: true });

  normalizarImports(destino);
  console.log(`Cliente generado en ${destino}`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

/** Añade `.js` a los imports relativos que el generador deja sin extensión. */
function normalizarImports(dir) {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      normalizarImports(ruta);
      continue;
    }
    if (!entrada.name.endsWith('.js')) continue;

    const original = readFileSync(ruta, 'utf8');
    const normalizado = original.replace(
      /(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g,
      (match, antes, rutaImport, despues) =>
        /\.(js|mjs|cjs|json)$/.test(rutaImport) ? match : `${antes}${rutaImport}.js${despues}`,
    );
    if (normalizado !== original) writeFileSync(ruta, normalizado);
  }
}
