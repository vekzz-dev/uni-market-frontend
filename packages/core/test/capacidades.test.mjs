// Capacidades por rol: jerarquía y límites de la matriz del PRD.

import { test } from "node:test";
import assert from "node:assert/strict";

import { CAPACIDADES, ROLES, esRolValido, puede } from "../src/index.js";

test("miembro publica y conversa, pero no modera ni administra", () => {
  assert.equal(puede("miembro", "anuncios.publicar"), true);
  assert.equal(puede("miembro", "conversaciones.usar"), true);
  assert.equal(puede("miembro", "moderacion.decidir"), false);
  assert.equal(puede("miembro", "admin.usuarios"), false);
});

test("moderador hereda lo de miembro y suma moderación", () => {
  assert.equal(puede("moderador", "anuncios.publicar"), true);
  assert.equal(puede("moderador", "moderacion.decidir"), true);
  assert.equal(puede("moderador", "categorias.gestionar"), true);
  assert.equal(puede("moderador", "admin.roles"), false);
});

test("admin hereda la jerarquía completa", () => {
  assert.equal(puede("admin", "moderacion.decidir"), true);
  assert.equal(puede("admin", "admin.usuarios"), true);
  assert.equal(puede("admin", "admin.roles"), true);
});

test("sin rol, o con rol o capacidad desconocidos, no hay permiso", () => {
  assert.equal(puede(null, "anuncios.publicar"), false);
  assert.equal(puede(undefined, "anuncios.publicar"), false);
  assert.equal(puede("miembro", "capacidad.inexistente"), false);
  assert.equal(puede("superadmin", "admin.roles"), false);
});

test("la matriz es explícita y los roles son los tres del contrato", () => {
  assert.deepEqual([...ROLES].sort(), ["admin", "miembro", "moderador"]);
  assert.equal(esRolValido("moderador"), true);
  assert.equal(esRolValido("invitado"), false);
  assert.ok(Object.keys(CAPACIDADES).length >= 6);
});
