import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Registro, Restablecer, Reenviar } from "../src/pantallas/Sesion.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
});

async function montar(componente, cliente) {
  const vista = await render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <SesionContexto.Provider
        value={{
          cliente,
          sesion: { ejecutar: (o) => o(), cerrarSesion: jest.fn() },
          estado: { estado: "anonimo", usuario: null },
          restaurado: true,
        }}
      >
        {componente}
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );
  return vista;
}

// En RTL 14 fireEvent es asíncrono: sin await el estado no se actualiza.
async function rellenar(vista, valores) {
  for (const [etiqueta, valor] of Object.entries(valores)) {
    await fireEvent.changeText(vista.getByLabelText(etiqueta), valor);
  }
}

describe("el código se teclea, no se manda al login", () => {
  it("el registro lleva a la pantalla del PIN con el correo puesto", async () => {
    const registrarUsuario = jest.fn().mockResolvedValue({});
    const vista = await montar(<Registro />, {
      usuarios: { registrarUsuario },
    });

    await vista.findByLabelText("Nombre");
    await rellenar(vista, {
      Nombre: "Ana",
      Correo: "ana@uni.edu",
      Contraseña: "secreta123",
    });
    await fireEvent.press(vista.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/confirmar",
        params: { email: "ana@uni.edu" },
      }),
    );
  });

  it("restablecer lleva al formulario del código con el correo puesto", async () => {
    const solicitarRestablecimiento = jest.fn().mockResolvedValue({});
    const vista = await montar(<Restablecer />, {
      auth: { solicitarRestablecimiento },
    });

    await vista.findByLabelText("Correo");
    await rellenar(vista, { Correo: "ana@uni.edu" });
    await fireEvent.press(vista.getByRole("button", { name: "Enviar código" }));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/nueva-contrasena",
        params: { email: "ana@uni.edu" },
      }),
    );
  });

  it("reenviar lleva a la pantalla del PIN", async () => {
    const reenviarConfirmacion = jest.fn().mockResolvedValue({});
    const vista = await montar(<Reenviar />, {
      auth: { reenviarConfirmacion },
    });

    await vista.findByLabelText("Correo");
    await rellenar(vista, { Correo: "ana@uni.edu" });
    await fireEvent.press(vista.getByRole("button", { name: "Enviar código" }));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/confirmar",
        params: { email: "ana@uni.edu" },
      }),
    );
  });
});
