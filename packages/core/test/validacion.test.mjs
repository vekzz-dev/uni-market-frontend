// Validación espejo: las reglas del contrato, ni más ni menos.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  validarRegistro,
  validarPrecio,
  validarImagenes,
  validarAvatar,
  validarMensaje,
  validarMotivo,
  validarPin,
  validarEmail,
} from "../src/index.js";

const archivo = (size, type = "image/png") => ({
  size,
  type,
  name: "foto.png",
});

test("un registro válido no produce errores", () => {
  assert.deepEqual(
    validarRegistro({
      nombre: "Ana",
      email: "ana@uni.edu",
      contrasena: "secreta123",
    }),
    [],
  );
});

test("el registro señala cada campo que falta", () => {
  const errores = validarRegistro({
    nombre: "  ",
    email: "no-es-correo",
    contrasena: "corta",
  });

  assert.deepEqual(
    errores.map((e) => e.campo),
    ["nombre", "email", "contrasena"],
  );
});

test("la contraseña exige 8 caracteres y no reglas de composición", () => {
  const errores = validarRegistro({
    nombre: "Ana",
    email: "a@b.co",
    contrasena: "12345678",
  });

  assert.deepEqual(errores, [], "ocho dígitos simples son válidos");
});

test("el precio respeta el rango 0..99999999.99", () => {
  assert.equal(validarPrecio(0), null);
  assert.equal(validarPrecio(99_999_999.99), null);
  assert.match(validarPrecio(-1), /negativo/);
  assert.match(validarPrecio(100_000_000), /máximo/);
  assert.match(validarPrecio("no-es-numero"), /número/);
  assert.match(validarPrecio(null), /Escribe un precio/);
});

test("las imágenes respetan cantidad, tamaño y tipo", () => {
  assert.equal(validarImagenes([archivo(1024)]), null);
  assert.match(validarImagenes([]), /al menos una/);
  assert.match(
    validarImagenes(Array.from({ length: 6 }, () => archivo(1024))),
    /hasta 5/,
  );
  assert.match(validarImagenes([archivo(6 * 1024 * 1024)]), /5 MB/);
  assert.match(
    validarImagenes([archivo(1024, "application/pdf")]),
    /Formato no admitido/,
  );
});

test("el avatar se limita a 2 MB", () => {
  assert.equal(validarAvatar(archivo(2 * 1024 * 1024)), null);
  assert.match(validarAvatar(archivo(2 * 1024 * 1024 + 1)), /2 MB/);
});

test("el mensaje se recorta y rechaza vacío", () => {
  assert.equal(validarMensaje("  hola  "), null);
  assert.match(validarMensaje("   "), /Escribe un mensaje/);
});

test("el motivo de moderación es obligatorio", () => {
  assert.equal(validarMotivo("No cumple las normas"), null);
  assert.match(validarMotivo("  "), /Explica el motivo/);
});

// PIN de confirmación y reset (R11, issue #8): el contrato exige `^\d{6}$`.
test("un PIN de seis dígitos es válido", () => {
  assert.equal(validarPin("123456"), null);
  assert.equal(validarPin("000000"), null);
});

test("el PIN rechaza cualquier cosa que no sean exactamente 6 dígitos", () => {
  for (const invalido of [
    "12345",
    "1234567",
    "12345a",
    "12 456",
    " 123456 ",
    "",
  ]) {
    assert.equal(
      typeof validarPin(invalido),
      "string",
      `debería rechazar ${JSON.stringify(invalido)}`,
    );
  }
});

test("el PIN ausente o no textual se rechaza", () => {
  for (const invalido of [undefined, null, 123456]) {
    assert.equal(
      typeof validarPin(invalido),
      "string",
      `debería rechazar ${String(invalido)}`,
    );
  }
});

test("el email se puede validar por separado y coincide con la regla del registro", () => {
  assert.equal(validarEmail("ana@uni.edu"), null);
  assert.equal(typeof validarEmail("nada"), "string");
  assert.equal(typeof validarEmail(""), "string");
  assert.equal(typeof validarEmail("ana@uni"), "string");
});
