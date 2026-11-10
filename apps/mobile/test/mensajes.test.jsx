import { act, fireEvent, render } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Mensajes } from "../src/pantallas/Mensajes.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useFocusEffect: jest.fn(),
}));

const conversacion = {
  id: "c1",
  anuncioId: "a1",
  compradorId: "u1",
  vendedorId: "u2",
  contraparteNombre: "Ana P.",
  fechaActualizacion: "2026-11-09T10:00:00Z",
  anuncio: { id: "a1", nombre: "Bicicleta", precio: 210, imagenUrls: [] },
  ultimoMensaje: { id: "m1", texto: "¿Sigue disponible?" },
  noLeidos: 2,
};

async function montar(datos = [conversacion]) {
  const cliente = {
    conversaciones: {
      listarMisConversaciones: jest.fn().mockResolvedValue({
        datos,
        paginacion: {
          pagina: 0,
          limite: 10,
          total: datos.length,
          totalPaginas: 1,
        },
      }),
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
        <Mensajes />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return vista;
}

describe("pantalla Mensajes (móvil)", () => {
  it("lista las conversaciones con último mensaje y no leídos", async () => {
    const vista = await montar();

    expect(await vista.findByText("Bicicleta")).toBeTruthy();
    expect(vista.getByText("¿Sigue disponible?")).toBeTruthy();
    expect(vista.getByText(/Con Ana P\./)).toBeTruthy();
    expect(vista.getByLabelText("2 sin leer")).toBeTruthy();
  });

  it("muestra el vacío", async () => {
    const vista = await montar([]);

    expect(await vista.findByText("Aún no tienes conversaciones")).toBeTruthy();
  });

  it("abre el hilo de una conversación", async () => {
    const vista = await montar();

    await vista.findByText("Bicicleta");
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Abrir" }));
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/mensajes/c1");
  });
});
