// Paginación: cursor opaco, fusión sin duplicados y navegación por offset.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { siguienteCursor, fusionarPagina, estadoOffset } from '../src/index.js';

test('el cursor se devuelve tal cual; null significa última página', () => {
  assert.equal(siguienteCursor({ cursorSiguiente: 'opaco-abc' }), 'opaco-abc');
  assert.equal(siguienteCursor({ cursorSiguiente: null }), null);
  assert.equal(siguienteCursor(undefined), null);
});

test('fusionar deduplica por id conservando el orden', () => {
  const vigentes = [{ id: 'a' }, { id: 'b' }];
  const nuevos = [{ id: 'b' }, { id: 'c' }];

  assert.deepEqual(
    fusionarPagina(vigentes, nuevos).map((x) => x.id),
    ['a', 'b', 'c'],
  );
});

test('el historial carga hacia atrás: lo nuevo va al principio', () => {
  const vigentes = [{ id: 'm3' }, { id: 'm4' }];
  const nuevos = [{ id: 'm1' }, { id: 'm2' }];

  assert.deepEqual(
    fusionarPagina(vigentes, nuevos, { alPrincipio: true }).map((x) => x.id),
    ['m1', 'm2', 'm3', 'm4'],
  );
});

test('los elementos sin id no se descartan', () => {
  assert.deepEqual(fusionarPagina([], [{ nombre: 'sin id' }]), [{ nombre: 'sin id' }]);
});

test('offset: la lista vacía no tiene páginas y no es un error', () => {
  assert.deepEqual(estadoOffset({ pagina: 0, totalPaginas: 0 }), {
    hayAnterior: false,
    haySiguiente: false,
  });
});

test('offset: bordes de la primera y la última página', () => {
  assert.deepEqual(estadoOffset({ pagina: 0, totalPaginas: 3 }), {
    hayAnterior: false,
    haySiguiente: true,
  });
  assert.deepEqual(estadoOffset({ pagina: 2, totalPaginas: 3 }), {
    hayAnterior: true,
    haySiguiente: false,
  });
});
