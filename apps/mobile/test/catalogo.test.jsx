import { render, screen } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Catalogo } from "../src/pantallas/Catalogo.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

// El primer test de la suite paga el arranque de jest-expo; en CI supera los 5 s
// por defecto. El límite propio de cada consulta sigue siendo 5 s.
jest.setTimeout(20000);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const anuncio = {
  id: "a1",
  nombre: "Calculadora",
  precio: 45,
  categoriaId: null,
  vendedorId: "u1",
  vendedorNombre: "Ana P.",
  fechaCreacion: "2026-10-01T10:00:00Z",
  imagenUrls: [],
};

function montar(cliente) {
  return render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <SesionContexto.Provider
        value={{
          cliente,
          sesion: { cerrarSesion: jest.fn() },
          estado: { estado: "anonimo", usuario: null },
        }}
      >
        <Catalogo />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );
}

const cliente = () => ({
  catalogo: {
    buscarCatalogo: jest.fn().mockResolvedValue({
      datos: [anuncio],
      paginacion: { cursorSiguiente: null },
    }),
  },
  categorias: {
    listarCategorias: jest.fn().mockResolvedValue({ datos: [] }),
  },
});

describe("pantalla Catálogo (móvil)", () => {
  it("pinta la primera página con vendedor y precio", async () => {
    await montar(cliente());

    expect(
      await screen.findByText("Calculadora", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByText(/\$45\.00/)).toBeTruthy();
    expect(screen.getByText(/Ana P\./)).toBeTruthy();
  });

  it("muestra el error de la primera carga", async () => {
    const api = cliente();
    api.catalogo.buscarCatalogo.mockRejectedValue({ status: 500 });

    await montar(api);

    expect(
      await screen.findByText(/Algo falló/, {}, { timeout: 5000 }),
    ).toBeTruthy();
  });
});
