// Copy de errores por estado HTTP (docs/api-integration.md §3.2).

import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError } from "@uni-market/api-client";
import { mapearProblema } from "../src/index.js";

const apiError = (status, detail = null) =>
  new ApiError(`HTTP ${status}`, {
    status,
    problem: { type: "about:blank", title: "Problema", status, detail },
    requestId: "req-1",
  });

test("401 es genérico: no adivina si la cuenta existe o está inhabilitada", () => {
  const { mensaje } = mapearProblema(apiError(401));

  assert.match(mensaje, /sesión terminó/i);
  assert.doesNotMatch(mensaje, /inhabilitada|baja|no existe/i);
});

test("404 usa el mismo mensaje para inexistente e invisible (R4)", () => {
  const { mensaje } = mapearProblema(apiError(404));

  assert.equal(mensaje, "Este anuncio ya no está disponible.");
});

test("422 muestra el detail del servidor como texto", () => {
  const resultado = mapearProblema(
    apiError(422, "El mensaje no puede estar vacío."),
  );

  assert.equal(resultado.mensaje, "El mensaje no puede estar vacío.");
  assert.equal(resultado.detalle, "El mensaje no puede estar vacío.");
});

test("429 no promete una cuenta atrás: no hay Retry-After en el contrato", () => {
  const { mensaje } = mapearProblema(apiError(429));

  assert.match(mensaje, /espera un minuto/i);
  assert.doesNotMatch(mensaje, /\d+\s*(s|segundos)/i);
});

test("un 5xx conserva el X-Request-Id para soporte", () => {
  const resultado = mapearProblema(apiError(503));

  assert.match(resultado.mensaje, /algo falló/i);
  assert.equal(resultado.requestId, "req-1");
});

test("un fallo de red se presenta como problema de conexión", () => {
  const resultado = mapearProblema({ status: 0 });

  assert.match(resultado.mensaje, /conexión/i);
});
