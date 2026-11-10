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

describe("pantalla Publicar (móvil): envío", () => {
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

  it("publica con la imagen elegida y el payload esperado", async () => {
    const { crearAnuncio, vista } = await montar();

    fireEvent.changeText(vista.getByLabelText("Nombre"), "Calculadora");
    fireEvent.changeText(vista.getByLabelText("Precio (USD)"), "45");
    await pulsar(vista.getByRole("button", { name: "Añadir imágenes" }));
    await waitFor(() =>
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled(),
    );

    await pulsar(vista.getByRole("button", { name: "Publicar anuncio" }));

    await waitFor(() =>
      expect(crearAnuncio).toHaveBeenCalledWith(
        "Calculadora",
        45,
        [
          expect.objectContaining({
            uri: "file:///foto.png",
            name: "foto.png",
            type: "image/png",
          }),
        ],
        { descripcion: undefined, categoriaId: undefined },
      ),
    );
    expect(await vista.findByText("Anuncio publicado")).toBeTruthy();
    await act(async () => {});
  });
});
