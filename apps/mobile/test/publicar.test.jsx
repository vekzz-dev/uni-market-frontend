import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { themeFor } from "@uni-market/design-tokens";
import { Publicar } from "../src/pantallas/Publicar.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const asset = {
  uri: "file:///foto.png",
  fileName: "foto.png",
  mimeType: "image/png",
  fileSize: 1024,
};

async function montar({ crearAnuncio = jest.fn().mockResolvedValue({}) } = {}) {
  const cliente = {
    anuncios: { crearAnuncio },
    categorias: {
      listarCategorias: jest
        .fn()
        .mockResolvedValue({ datos: [{ id: 1, nombre: "Electrónica" }] }),
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
        <Publicar />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { crearAnuncio, vista };
}

const pulsar = (elemento) =>
  act(async () => {
    fireEvent.press(elemento);
  });

describe("pantalla Publicar (móvil)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [asset],
    });
  });

  it("avisa si no hay permiso para las fotos", async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
    });
    const { vista } = await montar();

    await pulsar(vista.getByRole("button", { name: "Añadir imágenes" }));

    expect(
      await vista.findByText("Necesitamos acceso a tus fotos para publicar."),
    ).toBeTruthy();
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it("valida nombre, precio e imágenes antes de llamar a la API", async () => {
    const { crearAnuncio, vista } = await montar();

    await pulsar(vista.getByRole("button", { name: "Publicar anuncio" }));

    expect(vista.getByText("Escribe un nombre.")).toBeTruthy();
    expect(vista.getByText("Escribe un precio.")).toBeTruthy();
    expect(vista.getByText("Añade al menos una imagen.")).toBeTruthy();
    expect(crearAnuncio).not.toHaveBeenCalled();
  });

  it("muestra el error del servidor y no publica", async () => {
    const { crearAnuncio, vista } = await montar({
      crearAnuncio: jest.fn().mockRejectedValue({ status: 422 }),
    });

    fireEvent.changeText(await vista.findByLabelText("Nombre"), "Calculadora");
    fireEvent.changeText(vista.getByLabelText("Precio (USD)"), "45");
    await pulsar(vista.getByRole("button", { name: "Añadir imágenes" }));
    await waitFor(() =>
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled(),
    );
    await pulsar(vista.getByRole("button", { name: "Publicar anuncio" }));

    await waitFor(() => expect(crearAnuncio).toHaveBeenCalled());
    expect(
      await vista.findByText("Revisa los datos del formulario."),
    ).toBeTruthy();
  });
});
