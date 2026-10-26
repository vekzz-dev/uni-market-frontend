import { render, screen, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Catalogo } from "../src/pantallas/Catalogo.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

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
  fechaCreacion: new Date().toISOString(),
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

it("pinta la primera página con vendedor y precio", async () => {
  const cliente = {
    catalogo: {
      buscarCatalogo: jest.fn().mockResolvedValue({
        datos: [anuncio],
        paginacion: { cursorSiguiente: null },
      }),
    },
    categorias: {
      listarCategorias: jest.fn().mockResolvedValue({ datos: [] }),
    },
  };
  montar(cliente);

  await waitFor(() => expect(screen.getByText("Calculadora")).toBeTruthy());
  expect(screen.getByText(/\$45\.00/)).toBeTruthy();
  expect(screen.getByText(/Ana P\./)).toBeTruthy();
});
