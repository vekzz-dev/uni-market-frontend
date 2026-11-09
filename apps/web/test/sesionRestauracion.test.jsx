// Regresión S4: restaurar sesión no expulsa de una ruta protegida con refresh
// válido, y un fallo de restauración debe terminar la espera y redirigir.
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  SesionContexto,
  SesionProvider,
} from "../src/sesion/SesionContexto.jsx";
import { MisAnuncios } from "../src/pantallas/MisAnuncios.jsx";
import { Publicar } from "../src/pantallas/Publicar.jsx";
import { EditarAnuncio } from "../src/pantallas/EditarAnuncio.jsx";

const anuncio = {
  id: "a1",
  nombre: "Bicicleta",
  precio: 210,
  vendedorId: "u1",
  vendedorNombre: "Ana",
  fechaCreacion: "2026-11-01T10:00:00Z",
  estado: "disponible",
  estadoRevision: "aprobado",
  retraido: false,
};
const anonimo = { estado: "anonimo", usuario: null };
const json = (datos, status = 200) => ({
  ok: status < 300,
  status,
  headers: {
    get: (n) =>
      n.toLowerCase() === "content-type" ? "application/json" : null,
  },
  json: async () => datos,
  text: async () => JSON.stringify(datos),
});
const problema = (status) => ({
  ok: false,
  status,
  headers: { get: () => "application/problem+json" },
  json: async () => ({ title: "No autorizado", status }),
  text: async () => JSON.stringify({ title: "No autorizado", status }),
});
const cliente = () => ({
  anuncios: {
    listarMisAnuncios: vi.fn().mockResolvedValue({
      datos: [anuncio],
      paginacion: { pagina: 0, limite: 10, total: 1, totalPaginas: 1 },
    }),
    leerMiAnuncio: vi.fn().mockResolvedValue(anuncio),
  },
  categorias: { listarCategorias: vi.fn().mockResolvedValue({ datos: [] }) },
});
const tick = () => act(() => new Promise((r) => setTimeout(r, 30)));

const ENTRADAS = {
  mis: "/mis-anuncios",
  publicar: "/publicar",
  editar: "/mis-anuncios/a1/editar",
};

const rutas = {
  mis: () => <Route path="/mis-anuncios" element={<MisAnuncios />} />,
  publicar: () => <Route path="/publicar" element={<Publicar />} />,
  editar: () => (
    <Route path="/mis-anuncios/:id/editar" element={<EditarAnuncio />} />
  ),
};

function montarGuard(tipo, restaurado) {
  return render(
    <MemoryRouter initialEntries={[ENTRADAS[tipo]]}>
      <SesionContexto.Provider
        value={{
          cliente: cliente(),
          sesion: { ejecutar: (operacion) => operacion() },
          estado: anonimo,
          restaurado,
        }}
      >
        <Routes>
          {rutas[tipo]()}
          <Route path="/entrar" element={<h1>Entrar</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("guards mientras se restaura la sesión", () => {
  it.each(["mis", "publicar", "editar"])(
    "%s no redirige ni pinta contenido con restaurado=false",
    async (tipo) => {
      montarGuard(tipo, false);
      await tick();
      expect(screen.queryByRole("heading", { name: "Entrar" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Mis anuncios" }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Publicar anuncio" }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Guardar cambios" }),
      ).toBeNull();
    },
  );

  it.each(["mis", "publicar", "editar"])(
    "%s redirige a entrar al terminar sin sesión",
    async (tipo) => {
      montarGuard(tipo, true);
      expect(
        await screen.findByRole("heading", { name: "Entrar" }),
      ).toBeTruthy();
    },
  );
});

describe("SesionProvider: desenlaces de restaurar()", () => {
  const fetchOriginal = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  function montarPanel() {
    return render(
      <StrictMode>
        <MemoryRouter initialEntries={["/mis-anuncios"]}>
          <SesionProvider>
            <Routes>
              <Route path="/mis-anuncios" element={<MisAnuncios />} />
              <Route path="/entrar" element={<h1>Entrar</h1>} />
            </Routes>
          </SesionProvider>
        </MemoryRouter>
      </StrictMode>,
    );
  }

  it("con refresh válido no expulsa, restaura una vez y pinta el panel", async () => {
    localStorage.setItem("umi.refresh", "r1");
    const refrescos = [];
    globalThis.fetch = vi.fn((url) => {
      const texto = String(url);
      if (texto.endsWith("/auth/refresh"))
        return new Promise((resolver) => refrescos.push(resolver));
      return Promise.resolve(
        json({
          datos: [anuncio],
          paginacion: { pagina: 0, limite: 10, total: 1, totalPaginas: 1 },
        }),
      );
    });

    montarPanel();
    await tick();
    expect(screen.queryByRole("heading", { name: "Entrar" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Mis anuncios" })).toBeNull();

    await act(async () => {
      refrescos[0](
        json({
          accessToken: "a2",
          refreshToken: "r2",
          expiraEnSegundos: 900,
          usuario: { id: "u1", nombre: "Ana" },
        }),
      );
      await Promise.resolve();
    });

    expect(
      await screen.findByRole("heading", { name: "Mis anuncios" }),
    ).toBeTruthy();
    expect(await screen.findByText("Bicicleta")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Entrar" })).toBeNull();
    expect(refrescos).toHaveLength(1);
    expect(localStorage.getItem("umi.refresh")).toBe("r2");
  });

  it("con refresh inválido termina la espera y redirige a entrar", async () => {
    localStorage.setItem("umi.refresh", "r1");
    globalThis.fetch = vi.fn((url) =>
      String(url).endsWith("/auth/refresh")
        ? Promise.resolve(problema(401))
        : Promise.reject(new Error(`No debía llamarse: ${url}`)),
    );

    montarPanel();
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Mis anuncios" })).toBeNull();
    expect(localStorage.getItem("umi.refresh")).toBeNull();
  });
});
