// Flujo integrado de sesión con MSW: registro → login → refresh transparente → logout.
// Usa el cliente generado real y el gestor de sesión real; solo la red está simulada.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { useRef } from "react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Entrar } from "../../src/pantallas/Entrar.jsx";
import { SesionProvider, useSesion } from "../../src/sesion/SesionContexto.jsx";

const BASE = "http://localhost:8080/v1";

const usuario = { id: "u1", nombre: "Ana", rol: "miembro" };
let refreshValido = "r1";
let refrescos = 0;

const server = setupServer(
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      accessToken: "a1",
      refreshToken: "r1",
      expiraEnSegundos: 900,
      usuario,
    }),
  ),
  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    const { refreshToken } = await request.json();
    refrescos += 1;
    if (refreshToken !== refreshValido) {
      return HttpResponse.json(
        { title: "No autorizado", status: 401 },
        {
          status: 401,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }
    refreshValido = `r${Number(refreshValido.slice(1)) + 1}`;
    return HttpResponse.json({
      accessToken: `a-${refreshValido}`,
      refreshToken: refreshValido,
      expiraEnSegundos: 900,
      usuario,
    });
  }),
  http.post(
    `${BASE}/auth/logout`,
    () => new HttpResponse(null, { status: 204 }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  refrescos = 0;
  refreshValido = "r1";
});
afterAll(() => server.close());

function Sonda() {
  const { sesion, estado } = useSesion();
  const navegar = useNavigate();
  const intentos = useRef(0);

  return (
    <>
      <p>estado: {estado.estado}</p>
      <button
        type="button"
        onClick={async () => {
          // Fuerza el refresco transparente: la primera llamada falla con 401,
          // el gestor refresca una vez y el reintento sale bien.
          await sesion.ejecutar(() => {
            const primero = intentos.current === 0;
            intentos.current += 1;
            if (primero) {
              throw Object.assign(new Error("expirado"), { status: 401 });
            }
            return "ok";
          });
        }}
      >
        Forzar 401
      </button>
      <button type="button" onClick={() => navegar("/")}>
        Ir al catálogo
      </button>
      <button type="button" onClick={() => sesion.cerrarSesion()}>
        Cerrar sesión
      </button>
    </>
  );
}

function montar() {
  return render(
    <SesionProvider>
      <MemoryRouter initialEntries={["/entrar"]}>
        <Routes>
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/" element={<Sonda />} />
        </Routes>
      </MemoryRouter>
    </SesionProvider>,
  );
}

describe("flujo integrado de sesión (MSW)", () => {
  it("entra, persiste el refresh, refresca ante un 401 y cierra sesión", async () => {
    const usuarioEvento = userEvent.setup();
    montar();

    await usuarioEvento.type(
      await screen.findByLabelText("Correo"),
      "ana@uni.edu",
    );
    await usuarioEvento.type(screen.getByLabelText("Contraseña"), "secreta123");
    await usuarioEvento.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("estado: autenticado")).toBeTruthy();
    expect(localStorage.getItem("umi.refresh")).toBe("r1");

    await usuarioEvento.click(
      screen.getByRole("button", { name: "Forzar 401" }),
    );
    await waitFor(() => expect(refrescos).toBe(1));
    expect(localStorage.getItem("umi.refresh")).toBe("r2");
    expect(screen.getByText("estado: autenticado")).toBeTruthy();

    await usuarioEvento.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );
    await waitFor(() => expect(localStorage.getItem("umi.refresh")).toBeNull());
    expect(screen.getByText("estado: anonimo")).toBeTruthy();
  });
});
