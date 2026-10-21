// Resolver de URLs de medios: dev relativo, prod absoluto (docs/api-integration.md §5).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolverUrlMedia } from '../src/index.js';

const ORIGEN = 'http://localhost:8080';

test('una URL absoluta se usa tal cual (R2 en producción)', () => {
  const url = 'https://pub-abc.r2.dev/anuncios/u1/foto.png';

  assert.equal(resolverUrlMedia(url, ORIGEN), url);
});

test('una ruta relativa se prefija con el origen de la API', () => {
  assert.equal(
    resolverUrlMedia('/media/anuncios/u1/foto.png', ORIGEN),
    `${ORIGEN}/media/anuncios/u1/foto.png`,
  );
});

test('una ruta sin barra inicial también resuelve', () => {
  assert.equal(resolverUrlMedia('media/foto.png', ORIGEN), `${ORIGEN}/media/foto.png`);
});

test('sin origen devuelve la ruta tal cual y sin valor devuelve null', () => {
  assert.equal(resolverUrlMedia('/media/foto.png', ''), '/media/foto.png');
  assert.equal(resolverUrlMedia(null, ORIGEN), null);
});
