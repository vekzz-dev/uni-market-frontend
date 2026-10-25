// Sesión: access en memoria, refresh persistido, vuelo único y 401 transparente.

import { test } from "node:test";
import assert from "node:assert/strict";

import { crearGestorSesion, ESTADOS } from "../src/index.js";

const sesionFalsa = (n, expiraEnSegundos = 900) => ({
  accessToken: `a${n}`,
  refreshToken: `r${n}`,
  expiraEnSegundos,
  usuario: { id: "u1", nombre: "Ana", rol: "miembro" },
});

function authFalso({ expiraEnSegundos = 900 } = {}) {
  let n = 0;
  const llamadas = [];
  return {
    llamadas,
    async iniciarSesion(credenciales) {
      llamadas.push({ tipo: "login", credenciales });
      return sesionFalsa(n++, expiraEnSegundos);
    },
    async refrescarSesion({ refreshToken }) {
      llamadas.push({ tipo: "refresh", refreshToken });
      return sesionFalsa(n++, expiraEnSegundos);
    },
    async cerrarSesion({ refreshToken }) {
      llamadas.push({ tipo: "logout", refreshToken });
    },
  };
}

function almacenFalso(inicial = null) {
  return {
    valor: inicial,
    escrituras: [],
    async leer() {
      return this.valor;
    },
    async escribir(valor) {
      this.valor = valor;
      this.escrituras.push(valor);
    },
    async borrar() {
      this.valor = null;
    },
  };
}

const refrescos = (auth) =>
  auth.llamadas.filter((l) => l.tipo === "refresh").length;

test("iniciar sesión guarda solo el refresh y mantiene el access en memoria", async () => {
  const auth = authFalso();
  const almacen = almacenFalso();
  const gestor = crearGestorSesion({ auth, almacen, reloj: () => 0 });

  await gestor.iniciarSesion({
    email: "ana@uni.edu",
    contrasena: "secreta123",
  });

  assert.equal(gestor.obtenerEstado().estado, ESTADOS.AUTENTICADO);
  assert.equal(gestor.obtenerAccessToken(), "a0");
  assert.equal(almacen.valor, "r0", "solo el refresh se persiste");
  assert.deepEqual(almacen.escrituras, ["r0"]);
});

test("refresca de forma proactiva antes de que expire el access token", async () => {
  let ahora = 0;
  const auth = authFalso({ expiraEnSegundos: 900 });
  const gestor = crearGestorSesion({
    auth,
    almacen: almacenFalso(),
    reloj: () => ahora,
    margenMs: 60_000,
  });

  await gestor.iniciarSesion({});
  ahora = 900_000 - 61_000;
  await gestor.ejecutar(async () => "ok");
  assert.equal(refrescos(auth), 0, "todavía quedan 61 s");

  ahora = 900_000 - 30_000;
  await gestor.ejecutar(async () => "ok");
  assert.equal(
    refrescos(auth),
    1,
    "quedan 30 s: refresca antes de la petición",
  );
});

test("dos operaciones concurrentes comparten un solo refresh", async () => {
  let ahora = 0;
  const auth = authFalso();
  const almacen = almacenFalso();
  const gestor = crearGestorSesion({ auth, almacen, reloj: () => ahora });

  await gestor.iniciarSesion({});
  ahora = 10_000_000;

  const resultados = await Promise.all([
    gestor.ejecutar(async () => 1),
    gestor.ejecutar(async () => 2),
  ]);

  assert.deepEqual(resultados, [1, 2]);
  assert.equal(refrescos(auth), 1, "vuelo único");
  assert.equal(almacen.valor, "r1", "el refresh rotado se persiste");
});

test("ante un 401 refresca y reintenta una sola vez", async () => {
  const auth = authFalso();
  const gestor = crearGestorSesion({
    auth,
    almacen: almacenFalso(),
    reloj: () => 0,
  });

  await gestor.iniciarSesion({});
  let intentos = 0;

  const resultado = await gestor.ejecutar(async () => {
    intentos += 1;
    if (intentos === 1) throw Object.assign(new Error("401"), { status: 401 });
    return "ok";
  });

  assert.equal(resultado, "ok");
  assert.equal(intentos, 2, "exactamente dos intentos");
  assert.equal(refrescos(auth), 1);
});

test("un segundo 401 deja la sesión expirada y limpia el almacén", async () => {
  const auth = authFalso();
  const almacen = almacenFalso();
  const gestor = crearGestorSesion({ auth, almacen, reloj: () => 0 });

  await gestor.iniciarSesion({});

  await assert.rejects(() =>
    gestor.ejecutar(async () => {
      throw Object.assign(new Error("401"), { status: 401 });
    }),
  );

  assert.equal(gestor.obtenerEstado().estado, ESTADOS.EXPIRADO);
  assert.equal(gestor.obtenerAccessToken(), null);
  assert.equal(almacen.valor, null);
});

test("cerrar sesión llama al contrato y limpia el estado local", async () => {
  const auth = authFalso();
  const almacen = almacenFalso();
  const gestor = crearGestorSesion({ auth, almacen, reloj: () => 0 });

  await gestor.iniciarSesion({});
  await gestor.cerrarSesion();

  assert.equal(gestor.obtenerEstado().estado, ESTADOS.ANONIMO);
  assert.equal(almacen.valor, null);
  assert.ok(
    auth.llamadas.some((l) => l.tipo === "logout" && l.refreshToken === "r0"),
    "envía el refresh vigente",
  );
});

test("restaurar usa el refresh persistido para recuperar la sesión", async () => {
  const auth = authFalso();
  const gestor = crearGestorSesion({
    auth,
    almacen: almacenFalso("r-persistido"),
    reloj: () => 0,
  });

  const sesion = await gestor.restaurar();

  assert.equal(sesion.accessToken, "a0");
  assert.equal(gestor.obtenerEstado().estado, ESTADOS.AUTENTICADO);
  assert.ok(
    auth.llamadas.some(
      (l) => l.tipo === "refresh" && l.refreshToken === "r-persistido",
    ),
  );
});

test("restaurar sin refresh deja la sesión anónima y no llama a la API", async () => {
  const auth = authFalso();
  const gestor = crearGestorSesion({
    auth,
    almacen: almacenFalso(),
    reloj: () => 0,
  });

  const sesion = await gestor.restaurar();

  assert.equal(sesion, null);
  assert.equal(gestor.obtenerEstado().estado, ESTADOS.ANONIMO);
  assert.equal(auth.llamadas.length, 0);
});
