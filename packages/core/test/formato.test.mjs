// Formato de precio y fechas (D18: USD, idéntico en web y móvil).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatearPrecio,
  formatearFecha,
  formatearFechaRelativa,
} from "../src/index.js";

test("el precio se formatea en USD", () => {
  assert.equal(formatearPrecio(45), "$45.00");
  assert.equal(formatearPrecio(1234.5), "$1,234.50");
});

test("un precio inválido no rompe la interfaz", () => {
  assert.equal(formatearPrecio("no-es-numero"), "—");
  assert.equal(formatearPrecio(null), "—");
});

test("una fecha ISO se vuelve legible sin depender del huso", () => {
  const texto = formatearFecha("2026-01-02T00:00:00Z");

  assert.match(texto, /2026/);
  assert.notEqual(texto, "—");
  assert.equal(formatearFecha(null), "—");
});

test("la fecha relativa usa el reloj inyectado", () => {
  const ahora = new Date("2026-01-03T00:00:00Z").getTime();

  assert.equal(
    formatearFechaRelativa("2026-01-01T00:00:00Z", ahora),
    "hace 2 días",
  );
  assert.equal(
    formatearFechaRelativa("2026-01-02T23:58:00Z", ahora),
    "hace 2 minutos",
  );
  assert.equal(formatearFechaRelativa(null), "—");
});
