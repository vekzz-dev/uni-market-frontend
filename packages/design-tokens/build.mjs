// Genera build/tokens.css a partir de los tokens fuente.
// Determinista: la misma entrada produce exactamente el mismo archivo, y
// test/estructura.test.mjs falla si el CSS commiteado no coincide (deriva de tokens).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { space, radius, fontSize, lineHeight, fontWeight, duration, control, focus, fontFamily, shadow } from './src/primitives.js';
import { light, dark } from './src/semantic.js';

const here = dirname(fileURLToPath(import.meta.url));
const PREFIX = 'um';

const kebab = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const vars = (obj, grupo) =>
  Object.entries(obj)
    .map(([k, v]) => `  --${PREFIX}-${grupo ? `${grupo}-` : ''}${kebab(k)}: ${v};`)
    .join('\n');

const scales = () => [
  `  --${PREFIX}-font-family: ${fontFamily};`,
  vars(fontSize, 'font-size'),
  vars(lineHeight, 'line-height'),
  vars(fontWeight, 'font-weight'),
  vars(space, 'space'),
  vars(radius, 'radius'),
  vars(duration, 'duration'),
  `  --${PREFIX}-control-min-size: ${control.minSize};`,
  `  --${PREFIX}-focus-width: ${focus.width};`,
  `  --${PREFIX}-focus-offset: ${focus.offset};`,
  `  --${PREFIX}-shadow-elevated: ${shadow.elevated};`,
].join('\n');

export function generarCss() {
  return `/* GENERADO por build.mjs — no editar a mano.
   Fuente: src/primitives.js + src/semantic.js · Regenerar: node build.mjs
   Contraste verificado en test/contraste.test.mjs (WCAG 2.2 AA). */

:root {
  color-scheme: light;
${vars(light)}
${scales()}
}

/* Oscuro automático, salvo que la app fuerce el tema claro. */
@media (prefers-color-scheme: dark) {
  :root:not([data-${PREFIX}-theme='light']) {
    color-scheme: dark;
${vars(dark)}
  }
}

/* Oscuro forzado (permite probar sin cambiar el sistema operativo). */
[data-${PREFIX}-theme='dark'] {
  color-scheme: dark;
${vars(dark)}
}

/* El anillo de foco siempre visible: ancho, color y desplazamiento son requisito
   de accesibilidad (WCAG 1.4.11), no estética. */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: var(--${PREFIX}-focus-width) solid var(--${PREFIX}-focus);
  outline-offset: var(--${PREFIX}-focus-offset);
}
`;
}

const destino = join(here, 'build', 'tokens.css');

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, generarCss(), 'utf8');
  console.log(`tokens.css generado → ${destino}`);
}
