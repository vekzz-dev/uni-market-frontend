import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { EditarAnuncio } from "../src/pantallas/EditarAnuncio.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: "a2" }),
}));

const anuncio = {
  id: "a2",
  nombre: "Bicicleta",
  precio: 210,
  descripcion: "Rodada 29",
  categoriaId: 1,
  estado: "disponible",
  estadoRevision: "aprobado",
  retraido: false,
  imagenUrls: [],
};

async function montar({
  leerMiAnuncio = jest.fn().mockResolvedValue(anuncio),
  editarAnuncio = jest.fn().mockResolvedValue({}),
} = {}) {
  const cliente = {
    anuncios: { leerMiAnuncio, editarAnuncio },
    categorias: {
      listarCategorias: jest
        .fn()
        .mockResolvedValue({ datos: [{ id: 1, nombre: "Deportes" }] }),
    },
  };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: jest.fn(),
  };
  const estado = { estado: "autenticado", usuario: { id: "u1" } };

  const vista = await render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <EditarAnuncio />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { vista, editarAnuncio };
}

describe("pantalla Editar anuncio (móvil)", () => {
  it("carga el anuncio por id y lo precarga", async () => {
    const { vista } = await montar();

    const nombre = await vista.findByLabelText("Nombre");
    expect(nombre.props.value).toBe("Bicicleta");
    expect(vista.getByLabelText("Precio (USD)").props.value).toBe("210");
    expect(vista.getByLabelText("Descripción").props.value).toBe("Rodada 29");
  });

  it("muestra el desenlace cuando no existe o no es tuyo", async () => {
    const { vista } = await montar({
      leerMiAnuncio: jest.fn().mockRejectedValue({ status: 404 }),
    });

    expect(await vista.findByText("No encontramos ese anuncio")).toBeTruthy();
  });

  it("guarda los cambios y confirma la vuelta a revisión", async () => {
    const { vista, editarAnuncio } = await montar();

    const precio = await vista.findByLabelText("Precio (USD)");
    await act(async () => {
      fireEvent.changeText(precio, "200");
    });
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Guardar cambios" }));
    });

    await waitFor(() =>
      expect(editarAnuncio).toHaveBeenCalledWith("a2", {
        nombre: "Bicicleta",
        precio: 200,
        descripcion: "Rodada 29",
        categoriaId: 1,
      }),
    );
    expect(await vista.findByText("Anuncio actualizado")).toBeTruthy();
  });
});
