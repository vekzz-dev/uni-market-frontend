import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Perfil } from "../src/pantallas/Perfil.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const perfil = {
  id: "u1",
  email: "ana@uni.edu",
  nombre: "Ana María",
  urlAvatar: null,
  rol: "miembro",
};

async function montar({
  actualizarPerfil = jest
    .fn()
    .mockResolvedValue({ ...perfil, nombre: "Ana M." }),
  cambiarContrasena = jest.fn().mockResolvedValue(undefined),
} = {}) {
  const usuarios = {
    leerPerfilPropio: jest.fn().mockResolvedValue(perfil),
    actualizarPerfil,
    subirAvatar: jest.fn(),
    eliminarAvatar: jest.fn(),
    cambiarContrasena,
    darDeBajaCuenta: jest.fn(),
  };
  const cliente = { usuarios };
  const actualizarUsuario = jest.fn();
  const sesion = {
    ejecutar: (operacion) => operacion(),
    actualizarUsuario,
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
        <Perfil />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { vista, usuarios, actualizarUsuario };
}

describe("pantalla Perfil (móvil)", () => {
  it("carga los datos y deja el correo en solo lectura", async () => {
    const { vista } = await montar();

    expect(await vista.findByLabelText("Nombre")).toBeTruthy();
    expect(vista.getByLabelText("Nombre").props.value).toBe("Ana María");
    expect(vista.getByText("ana@uni.edu")).toBeTruthy();
  });

  it("valida la contraseña nueva antes de llamar a la API", async () => {
    const { vista, usuarios } = await montar();

    await vista.findByLabelText("Nombre");
    await act(async () => {
      fireEvent.changeText(
        vista.getByLabelText("Contraseña actual"),
        "vieja1234",
      );
      fireEvent.changeText(vista.getByLabelText("Nueva contraseña"), "corta");
    });
    await act(async () => {
      fireEvent.press(
        vista.getByRole("button", { name: "Cambiar contraseña" }),
      );
    });

    expect(
      vista.getByText("La contraseña necesita al menos 8 caracteres."),
    ).toBeTruthy();
    expect(usuarios.cambiarContrasena).not.toHaveBeenCalled();
  });

  it("pide confirmación antes de dar de baja", async () => {
    const { vista, usuarios } = await montar();

    await vista.findByLabelText("Nombre");
    await act(async () => {
      fireEvent.press(
        vista.getByRole("button", { name: "Dar de baja mi cuenta" }),
      );
    });

    expect(
      vista.getByText("¿Seguro que quieres dar de baja tu cuenta?"),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Cancelar" }));
    });
    expect(usuarios.darDeBajaCuenta).not.toHaveBeenCalled();
  });

  it("guarda el nombre y lo refleja en la sesión", async () => {
    const { vista, usuarios, actualizarUsuario } = await montar();

    const nombre = await vista.findByLabelText("Nombre");
    await act(async () => {
      fireEvent.changeText(nombre, "Ana M.");
    });
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Guardar cambios" }));
    });

    await waitFor(() =>
      expect(usuarios.actualizarPerfil).toHaveBeenCalledWith({
        nombre: "Ana M.",
      }),
    );
    expect(actualizarUsuario).toHaveBeenCalledWith({
      nombre: "Ana M.",
      urlAvatar: null,
    });
    expect(await vista.findByText("Perfil actualizado.")).toBeTruthy();
  });
});
