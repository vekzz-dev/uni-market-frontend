import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { AdminUsuarios } from "../src/pantallas/AdminUsuarios.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

const usuario = {
  id: "u1",
  email: "ana@uni.edu",
  nombre: "Ana Pérez",
  rol: "miembro",
  habilitado: true,
};

async function montar({
  datos = [usuario],
  rol = "admin",
  cambiarRol = jest.fn().mockResolvedValue({ ...usuario, rol: "moderador" }),
} = {}) {
  const administracion = {
    listarUsuarios: jest.fn().mockResolvedValue({
      datos,
      paginacion: {
        pagina: 0,
        limite: 10,
        total: datos.length,
        totalPaginas: 1,
      },
    }),
    cambiarRol,
    cambiarHabilitacion: jest.fn(),
  };
  const cliente = { administracion };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: jest.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u9", nombre: "Admin", rol },
  };

  const vista = await render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <AdminUsuarios />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { vista, administracion };
}

describe("pantalla Admin usuarios (móvil)", () => {
  it("lista los usuarios con rol y estado", async () => {
    const { vista } = await montar();

    expect(await vista.findByText("Ana Pérez")).toBeTruthy();
    expect(vista.getByText("ana@uni.edu")).toBeTruthy();
    expect(vista.getByText(/miembro · Habilitado/)).toBeTruthy();
  });

  it("no ofrece cambiarse el rol ni inhabilitarse a sí mismo", async () => {
    const { vista } = await montar({
      datos: [{ ...usuario, id: "u9", nombre: "Admin" }],
    });

    await vista.findByText("Admin");
    expect(vista.getByText("Tú")).toBeTruthy();
    expect(vista.queryByRole("button", { name: "Cambiar rol" })).toBeNull();
    expect(vista.queryByRole("button", { name: "Inhabilitar" })).toBeNull();
  });

  it("cambia el rol de otro usuario", async () => {
    const { vista, administracion } = await montar();

    await vista.findByText("Ana Pérez");
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Cambiar rol" }));
    });
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "moderador" }));
    });

    await waitFor(() =>
      expect(administracion.cambiarRol).toHaveBeenCalledWith("u1", {
        rol: "moderador",
      }),
    );
    expect(
      await vista.findByText("Rol de Ana Pérez actualizado a moderador."),
    ).toBeTruthy();
  });
});
