// Transporte del cliente generado: URL, auth, cuerpos, errores y deserialización.
// Usa un `fetch` falso: no depende de la red ni de la API levantada.

import { test } from "node:test";
import assert from "node:assert/strict";

import { crearCliente, ApiError, normalizarProblema } from "../src/index.js";
import AnuncioResumen from "../src/generado/model/AnuncioResumen.js";
import ColeccionAnuncios from "../src/generado/model/ColeccionAnuncios.js";

const BASE = "http://api.test/v1";

const respuestaJson = (cuerpo, { status = 200, headers = {} } = {}) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

function clienteCon(respuestas, { token = "tok-123" } = {}) {
  const llamadas = [];
  const fetchFalso = async (url, init) => {
    llamadas.push({ url, init });
    const siguiente = respuestas.shift();
    if (!siguiente) throw new Error(`fetch inesperado: ${url}`);
    return typeof siguiente === "function" ? siguiente(url, init) : siguiente;
  };
  return {
    cliente: crearCliente({
      baseUrl: BASE,
      fetchImpl: fetchFalso,
      getAccessToken: () => token,
    }),
    llamadas,
  };
}

test("el catálogo sale por fetch y devuelve modelos del contrato", async () => {
  const { cliente, llamadas } = clienteCon([
    respuestaJson({
      datos: [
        {
          id: "a1",
          nombre: "Calculadora científica",
          precio: 45,
          vendedorId: "v1",
          fechaCreacion: "2026-01-01T00:00:00Z",
        },
      ],
      paginacion: { cursorSiguiente: null },
    }),
  ]);

  const pagina = await cliente.catalogo.buscarCatalogo({ limite: 1 });

  const { url, init } = llamadas[0];
  assert.match(url, new RegExp(`^${BASE}/anuncios\\?`));
  assert.match(url, /limite=1/);
  assert.equal(init.method, "GET");
  // El catálogo es público: el contrato declara authNames vacío.
  assert.equal(init.headers.Authorization, undefined);

  assert.ok(pagina instanceof ColeccionAnuncios);
  assert.ok(pagina.datos[0] instanceof AnuncioResumen);
  assert.equal(pagina.datos[0].nombre, "Calculadora científica");
  assert.equal(pagina.paginacion.cursorSiguiente, null);
});

test("las rutas autenticadas envían el access token en memoria", async () => {
  const { cliente, llamadas } = clienteCon([
    respuestaJson({
      id: "u1",
      email: "ana@uni.edu",
      nombre: "Ana",
      urlAvatar: null,
      rol: "miembro",
      fechaVerificacionEmail: "2026-01-01T00:00:00Z",
      fechaCreacion: "2026-01-01T00:00:00Z",
    }),
  ]);

  await cliente.usuarios.leerPerfilPropio();

  assert.equal(llamadas[0].url, `${BASE}/usuarios/me`);
  assert.equal(llamadas[0].init.headers.Authorization, "Bearer tok-123");
});

test("un 422 se propaga como ApiError con problem+json y X-Request-Id", async () => {
  const { cliente } = clienteCon([
    new Response(
      JSON.stringify({
        type: "about:blank",
        title: "Regla de negocio",
        status: 422,
        detail: "El mensaje no puede estar vacío.",
      }),
      {
        status: 422,
        headers: {
          "content-type": "application/problem+json",
          "x-request-id": "req-1",
        },
      },
    ),
  ]);

  await assert.rejects(
    () => cliente.mensajes.enviarMensaje("c1", { contenido: "   " }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 422);
      assert.equal(error.problem.detail, "El mensaje no puede estar vacío.");
      assert.equal(error.requestId, "req-1");

      const normalizado = normalizarProblema(error);
      assert.equal(normalizado.status, 422);
      assert.equal(normalizado.detail, "El mensaje no puede estar vacío.");
      return true;
    },
  );
});

test("las subidas usan FormData y no fijan Content-Type", async () => {
  const { cliente, llamadas } = clienteCon([
    new Response(JSON.stringify({ id: "a1" }), {
      status: 201,
      headers: {
        "content-type": "application/json",
        location: "/v1/anuncios/a1",
      },
    }),
  ]);

  const archivo = new File([new Uint8Array([137, 80, 78, 71])], "foto.png", {
    type: "image/png",
  });
  await cliente.anuncios.crearAnuncio("Calculadora", 45, [archivo]);

  const { init } = llamadas[0];
  assert.ok(init.body instanceof FormData);
  assert.equal(
    init.headers["Content-Type"],
    undefined,
    "el boundary debe ponerlo la plataforma",
  );
  assert.equal(init.body.get("nombre"), "Calculadora");
  assert.equal(init.body.get("precio"), "45");
  assert.ok(init.body.get("imagenes") instanceof File);
});

test("204 devuelve data null sin intentar parsear el cuerpo", async () => {
  const { cliente } = clienteCon([new Response(null, { status: 204 })]);

  const data = await cliente.auth.cerrarSesion({ refreshToken: "r1" });

  assert.equal(data, null);
});

test("un fallo de red se normaliza con status 0", () => {
  const normalizado = normalizarProblema(new TypeError("fetch failed"));

  assert.equal(normalizado.status, 0);
  assert.equal(normalizado.title, "Error de red");
});
