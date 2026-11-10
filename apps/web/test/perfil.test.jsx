import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { Perfil } from "../src/pantallas/Perfil.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const perfil = {
  id: "u1",
  email: "ana@uni.edu",
  nombre: "Ana María",
  urlAvatar: null,
  rol: "miembro",
  fechaCreacion: "2026-01-01T00:00:00Z",
};

function montar({
  usuarios = {},
  actualizarUsuario = vi.fn(),
  cerrarSesion = vi.fn().mockResolvedValue(undefined),
} = {}) {
  const base = {
    leerPerfilPropio: vi.fn().mockResolvedValue(perfil),
    actualizarPerfil: vi
      .fn()
      .mockResolvedValue({ ...perfil, nombre: "Ana M." }),
    subirAvatar: vi.fn().mockResolvedValue({
      ...perfil,
      urlAvatar: "/media/avatares/u1.png",
    }),
    eliminarAvatar: vi.fn().mockResolvedValue(undefined),
    cambiarContrasena: vi.fn().mockResolvedValue(undefined),
    darDeBajaCuenta: vi.fn().mockResolvedValue(undefined),
    ...usuarios,
  };
  const cliente = { usuarios: base };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    actualizarUsuario,
    cerrarSesion,
  };
  const estado = { estado: "autenticado", usuario: { id: "u1" } };

  render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Routes>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );

  return { usuarios: base, actualizarUsuario, cerrarSesion };
}

describe("pantalla Perfil", () => {
  it("carga los datos del perfil y el correo es de solo lectura", async () => {
    montar();

    const nombre = await screen.findByLabelText("Nombre");
    expect(nombre.value).toBe("Ana María");
    expect(screen.getByLabelText("Correo").value).toBe("ana@uni.edu");
    expect(screen.getByLabelText("Correo").readOnly).toBe(true);
  });

  it("guarda el nombre y lo refleja en la sesión", async () => {
    const usuario = userEvent.setup();
    const { usuarios, actualizarUsuario } = montar();

    const nombre = await screen.findByLabelText("Nombre");
    await usuario.clear(nombre);
    await usuario.type(nombre, "Ana M.");
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    await waitFor(() =>
      expect(usuarios.actualizarPerfil).toHaveBeenCalledWith({
        nombre: "Ana M.",
      }),
    );
    expect(actualizarUsuario).toHaveBeenCalledWith({
      nombre: "Ana M.",
      urlAvatar: null,
    });
    expect(await screen.findByText("Perfil actualizado.")).toBeTruthy();
  });

  it("rechaza un avatar que no es imagen sin llamar a la API", async () => {
    const { usuarios } = montar();

    await screen.findByLabelText("Nombre");
    const archivo = new File(["x"], "nota.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Cambiar foto"), {
      target: { files: [archivo] },
    });

    expect(
      await screen.findByText("Formato no admitido: usa JPG, PNG, GIF o WEBP."),
    ).toBeTruthy();
    expect(usuarios.subirAvatar).not.toHaveBeenCalled();
  });

  it("sube un avatar válido y actualiza la sesión", async () => {
    const usuario = userEvent.setup();
    const { usuarios, actualizarUsuario } = montar();

    await screen.findByLabelText("Nombre");
    const archivo = new File(["x"], "foto.png", { type: "image/png" });
    await usuario.upload(screen.getByLabelText("Cambiar foto"), archivo);

    await waitFor(() => expect(usuarios.subirAvatar).toHaveBeenCalled());
    expect(actualizarUsuario).toHaveBeenCalledWith({
      urlAvatar: "/media/avatares/u1.png",
    });
    expect(await screen.findByText("Foto actualizada.")).toBeTruthy();
  });

  it("elimina el avatar cuando ya existe", async () => {
    const usuario = userEvent.setup();
    const { usuarios, actualizarUsuario } = montar({
      usuarios: {
        leerPerfilPropio: vi
          .fn()
          .mockResolvedValue({ ...perfil, urlAvatar: "/media/a.png" }),
      },
    });

    await screen.findByLabelText("Nombre");
    await usuario.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(usuarios.eliminarAvatar).toHaveBeenCalled());
    expect(actualizarUsuario).toHaveBeenCalledWith({ urlAvatar: null });
  });

  it("valida la contraseña nueva en el cliente", async () => {
    const usuario = userEvent.setup();
    const { usuarios } = montar();

    await screen.findByLabelText("Nombre");
    await usuario.type(screen.getByLabelText("Contraseña actual"), "vieja1234");
    await usuario.type(screen.getByLabelText("Nueva contraseña"), "corta");
    await usuario.click(
      screen.getByRole("button", { name: "Cambiar contraseña" }),
    );

    expect(
      screen.getByText("La contraseña necesita al menos 8 caracteres."),
    ).toBeTruthy();
    expect(usuarios.cambiarContrasena).not.toHaveBeenCalled();
  });

  it("cambia la contraseña cuando los datos son válidos", async () => {
    const usuario = userEvent.setup();
    const { usuarios } = montar();

    await screen.findByLabelText("Nombre");
    await usuario.type(screen.getByLabelText("Contraseña actual"), "vieja1234");
    await usuario.type(screen.getByLabelText("Nueva contraseña"), "nueva1234");
    await usuario.type(
      screen.getByLabelText("Repetir contraseña"),
      "nueva1234",
    );
    await usuario.click(
      screen.getByRole("button", { name: "Cambiar contraseña" }),
    );

    await waitFor(() =>
      expect(usuarios.cambiarContrasena).toHaveBeenCalledWith({
        contrasenaActual: "vieja1234",
        nuevaContrasena: "nueva1234",
      }),
    );
    expect(await screen.findByText("Contraseña actualizada.")).toBeTruthy();
  });

  it("no da de baja la cuenta si no se confirma", async () => {
    const usuario = userEvent.setup();
    const { usuarios, cerrarSesion } = montar();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    await screen.findByLabelText("Nombre");
    await usuario.click(
      screen.getByRole("button", { name: "Dar de baja mi cuenta" }),
    );

    expect(usuarios.darDeBajaCuenta).not.toHaveBeenCalled();
    expect(cerrarSesion).not.toHaveBeenCalled();
  });

  it("da de baja, cierra sesión y vuelve al catálogo", async () => {
    const usuario = userEvent.setup();
    const { usuarios, cerrarSesion } = montar();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await screen.findByLabelText("Nombre");
    await usuario.click(
      screen.getByRole("button", { name: "Dar de baja mi cuenta" }),
    );

    await waitFor(() => expect(usuarios.darDeBajaCuenta).toHaveBeenCalled());
    expect(cerrarSesion).toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Catálogo" }),
    ).toBeTruthy();
  });

  it("redirige a entrar sin sesión", async () => {
    const cliente = { usuarios: {} };
    render(
      <MemoryRouter initialEntries={["/perfil"]}>
        <SesionContexto.Provider
          value={{
            cliente,
            sesion: {},
            estado: { estado: "anonimo", usuario: null },
            restaurado: true,
          }}
        >
          <Routes>
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/entrar" element={<h1>Entrar</h1>} />
          </Routes>
        </SesionContexto.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar();

    await screen.findByLabelText("Nombre");
    expect((await axe(document.body)).violations).toEqual([]);
  });
});
