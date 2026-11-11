import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { ApiError } from "@uni-market/api-client";
import { Confirmar, NuevaContrasena } from "../src/pantallas/Sesion.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

let mockParams = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

const CODIGO_INVALIDO = "El código es inválido, expiró o ya fue usado.";

async function montar(componente, auth) {
  const cliente = { auth };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: jest.fn(),
  };

  const vista = await render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <SesionContexto.Provider
        value={{
          cliente,
          sesion,
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

// En RTL 14 `fireEvent` es asíncrono: sin await el estado no se actualiza.
async function rellenar(vista, valores) {
  for (const [etiqueta, valor] of Object.entries(valores)) {
    await fireEvent.changeText(vista.getByLabelText(etiqueta), valor);
  }
}

describe("Confirmar (móvil)", () => {
  it("envía email y PIN y confirma la cuenta", async () => {
    const confirmarEmail = jest.fn().mockResolvedValue({});
    mockParams = { email: "ana@uni.edu" };
    const vista = await montar(<Confirmar />, { confirmarEmail });

    await vista.findByLabelText("Correo");
    expect(vista.getByLabelText("Correo").props.value).toBe("ana@uni.edu");
    mockParams = {};
    await rellenar(vista, { Correo: "ana@uni.edu", Código: "123456" });
    await fireEvent.press(
      vista.getByRole("button", { name: "Confirmar cuenta" }),
    );

    expect(confirmarEmail).toHaveBeenCalledWith({
      email: "ana@uni.edu",
      pin: "123456",
    });
    await waitFor(() =>
      expect(vista.getByText("Cuenta confirmada")).toBeTruthy(),
    );
  });

  it("no llama a la API con un PIN que no tiene 6 dígitos", async () => {
    const confirmarEmail = jest.fn();
    const vista = await montar(<Confirmar />, { confirmarEmail });

    await vista.findByLabelText("Correo");
    await rellenar(vista, { Correo: "ana@uni.edu", Código: "12345" });
    await fireEvent.press(
      vista.getByRole("button", { name: "Confirmar cuenta" }),
    );

    expect(
      vista.getByText("El código debe tener exactamente 6 dígitos."),
    ).toBeTruthy();
    expect(confirmarEmail).not.toHaveBeenCalled();
  });

  it("muestra el mensaje genérico del servidor cuando el código no sirve", async () => {
    const confirmarEmail = jest.fn().mockRejectedValue(
      new ApiError(CODIGO_INVALIDO, {
        status: 422,
        problem: { detail: CODIGO_INVALIDO },
      }),
    );
    const vista = await montar(<Confirmar />, { confirmarEmail });

    await vista.findByLabelText("Correo");
    await rellenar(vista, { Correo: "ana@uni.edu", Código: "123456" });
    await fireEvent.press(
      vista.getByRole("button", { name: "Confirmar cuenta" }),
    );

    await waitFor(() => expect(vista.getByText(CODIGO_INVALIDO)).toBeTruthy());
    // Sigue en el formulario: quedan intentos y no se revela la causa.
    expect(vista.getByLabelText("Código")).toBeTruthy();
  });
});

describe("Nueva contraseña (móvil)", () => {
  it("envía email, PIN y la contraseña nueva", async () => {
    const confirmarRestablecimiento = jest.fn().mockResolvedValue(undefined);
    const vista = await montar(<NuevaContrasena />, {
      confirmarRestablecimiento,
    });

    await vista.findByLabelText("Correo");
    await rellenar(vista, {
      Correo: "ana@uni.edu",
      Código: "123456",
      "Nueva contraseña": "secreta123",
      "Repetir contraseña": "secreta123",
    });
    await fireEvent.press(
      vista.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(confirmarRestablecimiento).toHaveBeenCalledWith({
      email: "ana@uni.edu",
      pin: "123456",
      nuevaContrasena: "secreta123",
    });
    await waitFor(() =>
      expect(vista.getByText("Contraseña actualizada")).toBeTruthy(),
    );
  });

  it("exige un PIN de 6 dígitos antes de llamar a la API", async () => {
    const confirmarRestablecimiento = jest.fn();
    const vista = await montar(<NuevaContrasena />, {
      confirmarRestablecimiento,
    });

    await vista.findByLabelText("Correo");
    await rellenar(vista, {
      Correo: "ana@uni.edu",
      Código: "1234",
      "Nueva contraseña": "secreta123",
      "Repetir contraseña": "secreta123",
    });
    await fireEvent.press(
      vista.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(
      vista.getByText("El código debe tener exactamente 6 dígitos."),
    ).toBeTruthy();
    expect(confirmarRestablecimiento).not.toHaveBeenCalled();
  });

  it("exige que las contraseñas coincidan", async () => {
    const confirmarRestablecimiento = jest.fn();
    const vista = await montar(<NuevaContrasena />, {
      confirmarRestablecimiento,
    });

    await vista.findByLabelText("Correo");
    await rellenar(vista, {
      Correo: "ana@uni.edu",
      Código: "123456",
      "Nueva contraseña": "secreta123",
      "Repetir contraseña": "secreta124",
    });
    await fireEvent.press(
      vista.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(vista.getByText("Las contraseñas no coinciden.")).toBeTruthy();
    expect(confirmarRestablecimiento).not.toHaveBeenCalled();
  });
});
