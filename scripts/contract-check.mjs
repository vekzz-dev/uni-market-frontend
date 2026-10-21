// Verifica que el contrato vendorizado coincide con la referencia registrada.
// No necesita red ni el repositorio de la API.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contrato = join(root, 'openapi', 'uni-market.yaml');
const lockPath = join(root, 'openapi', 'CONTRACT.lock.json');

const errores = [];

if (!existsSync(contrato)) errores.push('falta openapi/uni-market.yaml — ejecuta `pnpm contract:sync`');
if (!existsSync(lockPath)) errores.push('falta openapi/CONTRACT.lock.json — ejecuta `pnpm contract:sync`');

if (errores.length === 0) {
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const sha256 = createHash('sha256').update(readFileSync(contrato)).digest('hex');
  if (sha256 !== lock.sha256) {
    errores.push(
      `el contrato vendorizado no coincide con el lock\n` +
        `  lock:   ${lock.sha256}\n` +
        `  actual: ${sha256}\n` +
        'Si el cambio es intencional, ejecuta `pnpm contract:sync` y commitea ambos archivos.',
    );
  }
  const version = /^info:[\s\S]*?^\s+version:\s*(.+)$/m.exec(readFileSync(contrato, 'utf8'))?.[1]?.trim();
  if (lock.apiVersion && version !== lock.apiVersion) {
    errores.push(`la versión del contrato (${version}) no coincide con el lock (${lock.apiVersion})`);
  }
}

if (errores.length > 0) {
  console.error('contract:check FALLÓ');
  for (const e of errores) console.error(`- ${e}`);
  process.exit(1);
}

console.log('contract:check OK — el contrato vendorizado coincide con su lock.');
