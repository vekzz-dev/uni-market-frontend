import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { MisAnuncios } from "../src/pantallas/MisAnuncios.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

// `useRouter` devuelve el mismo objeto en Expo; el mock debe imitarlo o el
// efecto de carga (que depende de `router`) se reejecuta en cada render.
const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  // El refetch al enfocar no hace falta para estas pruebas: el efecto de
  // carga ya corre al montar.
  useFocusEffect: jest.fn(),
}));

const pendiente = {
  id: "a1",
  nombre: "Calculadora",
  precio: 45,
  estado: "inactivo",
  estadoRevision: "pendiente",
  retraido: false,
  motivoRechazo: null,
  imagenUrls: [],
  fechaActualizacion: "2026-11-09T10:00:00Z",
};

const aprobado = {
  ...pendiente,
  id: "a2",
  nombre: "Bicicleta",
  estado: "disponible",
  estadoRevision: "aprobado",
};

async function montar({ datos = [pendiente, aprobado], ...acciones } = {}) {
  const cliente = {
    anuncios: {
      listarMisAnuncios: jest.fn().mockResolvedValue({
        datos,
        paginacion: {
          pagina: 0,
          limite: 10,
          total: datos.length,
          totalPaginas: 1,
        },
      }),
      alternarVisibilidad: jest.fn().mockResolvedValue({}),
      marcarVendido: jest.fn().mockResolvedValue({}),
      darDeBajaAnuncio: jest.fn().mockResolvedValue(undefined),
      ...acciones,
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
        <MisAnuncios />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { vista, cliente };
}

describe("pantalla Mis anuncios (móvil)", () => {
  it("lista los anuncios con su estado y el motivo del rechazo", async () => {
    const rechazado = {
      ...pendiente,
      id: "a3",
      nombre: "Libro",
      estadoRevision: "rechazado",
      motivoRechazo: "Las fotos no muestran el producto.",
    };
    const { vista } = await montar({ datos: [pendiente, aprobado, rechazado] });

    expect(await vista.findByText("Calculadora")).toBeTruthy();
    expect(vista.getByText("Pendiente")).toBeTruthy();
    expect(vista.getByText("Aprobado")).toBeTruthy();
    expect(vista.getByText("Las fotos no muestran el producto.")).toBeTruthy();
  });

  it("oculta un anuncio aprobado y recarga la lista", async () => {
    const { vista, cliente } = await montar();

    await vista.findByText("Bicicleta");
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Ocultar" }));
    });

    await waitFor(() =>
      expect(cliente.anuncios.alternarVisibilidad).toHaveBeenCalledWith("a2", {
        visible: false,
      }),
    );
    await waitFor(() =>
      expect(cliente.anuncios.listarMisAnuncios).toHaveBeenCalledTimes(2),
    );
  });

  it("muestra el vacío", async () => {
    const { vista } = await montar({ datos: [] });

    expect(await vista.findByText("Aún no publicaste nada")).toBeTruthy();
  });
});
