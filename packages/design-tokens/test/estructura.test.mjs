// Verificación estructural de los tokens: que no falte ningún rol, que los valores
// sean válidos y que el CSS generado no derive del código fuente.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { light, dark } from '../src/semantic.js';
import { generarCss } from '../build.mjs';
import { themeFor, themeNames } from '../src/index.js';
import { componentsFor } from '../src/components.js';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = join(here, '..', 'build', 'tokens.css');

const bloques = (css) => {
  const capturar = (patron) => {
    const m = css.match(patron);
    return m ? m[1] : '';
  };
  return {
    claro: capturar(/:root \{\n([\s\S]*?)\n\}/),
    oscuroForzado: capturar(/\[data-um-theme='dark'\] \{\n([\s\S]*?)\n\}/),
  };
};

const nombres = (bloque) => [...bloque.matchAll(/--um-([a-z0-9-]+):/g)].map((m) => m[1]);

test('los dos temas declaran exactamente los mismos roles', () => {
  const faltanEnOscuro = Object.keys(light).filter((k) => !(k in dark));
  const sobranEnOscuro = Object.keys(dark).filter((k) => !(k in light));
  assert.deepEqual(faltanEnOscuro, [], 'roles presentes en claro y ausentes en oscuro');
  assert.deepEqual(sobranEnOscuro, [], 'roles presentes en oscuro y ausentes en claro');
  assert.ok(Object.keys(light).length > 25, 'el tema claro debe declarar los roles completos');
});

test('todos los valores de color son hexadecimales de 6 dígitos', () => {
  const invalidos = Object.entries(light)
    .concat(Object.entries(dark))
    .filter(([, v]) => !/^#[0-9A-F]{6}$/i.test(v))
    .map(([k, v]) => `${k}=${v}`);
  assert.deepEqual(invalidos, []);
});

test('ningún token queda sin definir', () => {
  const vacios = Object.entries(light)
    .concat(Object.entries(dark))
    .filter(([, v]) => typeof v !== 'string' || v.trim() === '')
    .map(([k]) => k);
  assert.deepEqual(vacios, []);
});

test('el CSS commiteado está al día con los tokens (sin deriva)', () => {
  assert.ok(existsSync(cssPath), 'falta build/tokens.css — ejecuta: node build.mjs');
  const actual = readFileSync(cssPath, 'utf8');
  assert.equal(
    actual,
    generarCss(),
    'build/tokens.css no coincide con los tokens fuente: regenera con `node build.mjs`',
  );
});

test('el CSS no define la misma variable dos veces dentro de un bloque', () => {
  const { claro, oscuroForzado } = bloques(readFileSync(cssPath, 'utf8'));
  for (const [nombre, bloque] of Object.entries({ claro, oscuroForzado })) {
    const lista = nombres(bloque);
    const repetidas = lista.filter((n, i) => lista.indexOf(n) !== i);
    assert.deepEqual([...new Set(repetidas)], [], `variables duplicadas en el bloque ${nombre}`);
  }
});

test('todos los roles del tema llegan al CSS como variable', () => {
  const { claro } = bloques(readFileSync(cssPath, 'utf8'));
  const enCss = new Set(nombres(claro));
  const kebab = (k) => k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const faltan = Object.keys(light).filter((k) => !enCss.has(kebab(k)));
  assert.deepEqual(faltan, []);
});

test('el foco se aplica con ancho, color y desplazamiento', () => {
  const css = readFileSync(cssPath, 'utf8');
  assert.match(css, /:focus-visible \{\n\s+outline: var\(--um-focus-width\) solid var\(--um-focus\);/);
  assert.match(css, /outline-offset: var\(--um-focus-offset\);/);
});

test('themeFor entrega roles y componentes en ambos modos', () => {
  assert.deepEqual(themeNames.sort(), ['dark', 'light']);
  for (const modo of ['light', 'dark']) {
    const tema = themeFor(modo);
    assert.equal(tema.mode, modo);
    assert.ok(tema.components.button.primary.base.bg);
    // Las insignias se construyen SIEMPRE con el par suave, nunca con relleno sólido.
    for (const insignia of Object.values(tema.components.badge)) {
      assert.ok(insignia.bg && insignia.fg);
    }
  }
});

test('éxito y advertencia no exponen color de texto sobre relleno sólido', () => {
  // El relleno sólido no admite texto en AA (blanco sobre #16A34A = 3.30:1,
  // blanco sobre #D97706 = 3.19:1). La ausencia del token es la regla.
  for (const tema of [light, dark]) {
    assert.equal(tema.textOnSuccess, undefined);
    assert.equal(tema.textOnWarning, undefined);
  }
  assert.equal(typeof componentsFor(light).badge.approved.fg, 'string');
});
