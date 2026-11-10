import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Conversacion } from "../src/pantallas/Conversacion.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: "c1" }),
  useFocusEffect: jest.fn(),
}));

const recibido = {
  id: "m1",
  conversacionId: "c1",
  remitenteId: "u2",
  texto: "Hola, ¿sigue disponible?",
  fechaCreacion: "2026-11-09T10:24:00Z",
};

const propio = {
  id: "m2",
  conversacionId: "c1",
  remitenteId: "u1",
  texto: "Sí, sigue disponible.",
  fechaCreacion: "2026-11-09T10:26:00Z",
};

const detalle = {
  id: "c1",
  compradorId: "u1",
  vendedorId: "u2",
  contraparteNombre: "Ana P.",
  noLeidos: 1,
  anuncio: { id: "a1", nombre: "Bicicleta", precio: 210, imagenUrls: [] },
};

async function montar({
  leerConversacion = jest.fn().mockResolvedValue(detalle),
  listarMensajes = jest.fn().mockResolvedValue({
    datos: [propio, recibido],
    paginacion: { cursorSiguiente: null },
  }),
  enviarMensaje = jest.fn().mockResolvedValue({
    id: "m3",
    conversacionId: "c1",
    remitenteId: "u1",
    texto: "¿La dejas en 180?",
    fechaCreacion: "2026-11-09T10:30:00Z",
  }),
  marcarLecturas = jest.fn().mockResolvedValue(undefined),
} = {}) {
  const cliente = {
    conversaciones: { leerConversacion },
    mensajes: { listarMensajes, enviarMensaje, marcarLecturas },
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
        <Conversacion />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { vista, mensajes: cliente.mensajes };
}

describe("pantalla Conversación (móvil)", () => {
  it("carga el historial y marca la lectura una sola vez", async () => {
    const { vista, mensajes } = await montar();

    expect(await vista.findByText("Hola, ¿sigue disponible?")).toBeTruthy();
    expect(vista.getByText("Sí, sigue disponible.")).toBeTruthy();
    await waitFor(() =>
      expect(mensajes.marcarLecturas).toHaveBeenCalledWith("c1"),
    );
    expect(mensajes.marcarLecturas).toHaveBeenCalledTimes(1);
  });

  it("muestra el desenlace cuando no participa", async () => {
    const { vista } = await montar({
      leerConversacion: jest.fn().mockRejectedValue({ status: 403 }),
    });

    expect(
      await vista.findByText("No encontramos esa conversación"),
    ).toBeTruthy();
  });

  it("envía un mensaje y lo añade al historial", async () => {
    const { vista, mensajes } = await montar();

    await vista.findByText("Hola, ¿sigue disponible?");
    await act(async () => {
      fireEvent.changeText(
        vista.getByLabelText("Mensaje"),
        "¿La dejas en 180?",
      );
    });
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Enviar" }));
    });

    await waitFor(() =>
      expect(mensajes.enviarMensaje).toHaveBeenCalledWith("c1", {
        texto: "¿La dejas en 180?",
      }),
    );
    expect(await vista.findByText("¿La dejas en 180?")).toBeTruthy();
  });
});
