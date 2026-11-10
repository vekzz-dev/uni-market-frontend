import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { AdminCategorias } from "../src/pantallas/AdminCategorias.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

const categoria = {
  id: 1,
  nombre: "Electrónica",
  descripcion: "Dispositivos",
  icono: "cpu",
  orden: 1,
};

async function montar({ datos = [categoria], rol = "moderador" } = {}) {
  const categorias = {
    listarCategorias: jest.fn().mockResolvedValue({ datos }),
    crearCategoria: jest.fn().mockResolvedValue({ ...categoria, id: 2 }),
    actualizarCategoria: jest.fn(),
    eliminarCategoria: jest.fn(),
  };
  const cliente = { categorias };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: jest.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u9", nombre: "Mod", rol },
  };

  const vista = await render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <AdminCategorias />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { vista, categorias };
}

describe("pantalla Admin categorías (móvil)", () => {
  it("lista las categorías con orden", async () => {
    const { vista } = await montar();

    expect(await vista.findByText("Electrónica")).toBeTruthy();
    expect(vista.getByText(/Dispositivos · orden 1/)).toBeTruthy();
  });

  it("pide confirmación antes de eliminar", async () => {
    const { vista, categorias } = await montar();

    await vista.findByText("Electrónica");
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Eliminar" }));
    });
    expect(vista.getByRole("button", { name: "Sí, eliminar" })).toBeTruthy();
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Cancelar" }));
    });
    expect(categorias.eliminarCategoria).not.toHaveBeenCalled();
  });

  it("crea una categoría", async () => {
    const { vista, categorias } = await montar();

    await vista.findByText("Electrónica");
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Nueva categoría" }));
    });
    await act(async () => {
      fireEvent.changeText(vista.getByLabelText("Nombre"), "Instrumentos");
    });
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Guardar categoría" }));
    });

    await waitFor(() =>
      expect(categorias.crearCategoria).toHaveBeenCalledWith({
        nombre: "Instrumentos",
        descripcion: null,
        icono: null,
      }),
    );
    expect(await vista.findByText("Categoría creada.")).toBeTruthy();
  });
});
