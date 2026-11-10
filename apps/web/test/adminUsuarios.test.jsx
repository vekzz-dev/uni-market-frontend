import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { AdminUsuarios } from "../src/pantallas/AdminUsuarios.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const usuario = {
  id: "u1",
  email: "ana@uni.edu",
  nombre: "Ana Pérez",
  urlAvatar: null,
  rol: "miembro",
  habilitado: true,
  fechaCreacion: "2026-01-01T00:00:00Z",
};

function montar({
  datos = [usuario],
  totalPaginas = 1,
  rol = "admin",
  listarUsuarios,
  cambiarRol = vi.fn().mockResolvedValue({ ...usuario, rol: "moderador" }),
  cambiarHabilitacion = vi
    .fn()
    .mockResolvedValue({ ...usuario, habilitado: false }),
} = {}) {
  const administracion = {
    listarUsuarios:
      listarUsuarios ??
      vi.fn().mockResolvedValue({
        datos,
        paginacion: {
          pagina: 0,
          limite: 10,
          total: datos.length,
          totalPaginas,
        },
      }),
    cambiarRol,
    cambiarHabilitacion,
  };
  const cliente = { administracion };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u9", nombre: "Admin", rol },
  };

  render(
    <MemoryRouter initialEntries={["/admin/usuarios"]}>
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Routes>
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );

  return administracion;
}

describe("pantalla Admin usuarios", () => {
  it("lista los usuarios con rol y estado", async () => {
    montar();

    expect(await screen.findByText("Ana Pérez")).toBeTruthy();
    expect(screen.getByText("ana@uni.edu")).toBeTruthy();
    expect(screen.getByText("Habilitado")).toBeTruthy();
  });

  it("filtra por rol", async () => {
    const evento = userEvent.setup();
    const administracion = montar();

    await screen.findByText("Ana Pérez");
    await evento.click(screen.getByRole("button", { name: "Moderadores" }));

    await waitFor(() =>
      expect(administracion.listarUsuarios).toHaveBeenLastCalledWith({
        pagina: 0,
        limite: 10,
        rol: "moderador",
      }),
    );
  });

  it("busca por nombre o email y vuelve a la primera página", async () => {
    const evento = userEvent.setup();
    const administracion = montar({ totalPaginas: 3 });

    await screen.findByText("Ana Pérez");
    const buscador = screen.getByRole("search", { name: "Buscar usuarios" });
    await evento.type(
      within(buscador).getByLabelText("Buscar usuarios"),
      "ana",
    );
    await evento.click(
      within(buscador).getByRole("button", { name: "Buscar" }),
    );

    await waitFor(() =>
      expect(administracion.listarUsuarios).toHaveBeenLastCalledWith({
        pagina: 0,
        limite: 10,
        q: "ana",
      }),
    );
  });

  it("combina la búsqueda con el filtro de rol", async () => {
    const evento = userEvent.setup();
    const administracion = montar();

    await screen.findByText("Ana Pérez");
    const buscador = screen.getByRole("search", { name: "Buscar usuarios" });
    await evento.type(
      within(buscador).getByLabelText("Buscar usuarios"),
      "ana",
    );
    await evento.click(
      within(buscador).getByRole("button", { name: "Buscar" }),
    );
    await evento.click(screen.getByRole("button", { name: "Moderadores" }));

    await waitFor(() =>
      expect(administracion.listarUsuarios).toHaveBeenLastCalledWith({
        pagina: 0,
        limite: 10,
        rol: "moderador",
        q: "ana",
      }),
    );
  });

  it("limpia la búsqueda", async () => {
    const evento = userEvent.setup();
    const administracion = montar();

    await screen.findByText("Ana Pérez");
    const buscador = screen.getByRole("search", { name: "Buscar usuarios" });
    await evento.type(
      within(buscador).getByLabelText("Buscar usuarios"),
      "ana",
    );
    await evento.click(
      within(buscador).getByRole("button", { name: "Buscar" }),
    );
    await evento.click(screen.getByRole("button", { name: "Limpiar" }));

    await waitFor(() =>
      expect(administracion.listarUsuarios).toHaveBeenLastCalledWith({
        pagina: 0,
        limite: 10,
      }),
    );
  });

  it("muestra el vacío con el término buscado", async () => {
    const evento = userEvent.setup();
    montar({
      datos: [],
      listarUsuarios: vi.fn().mockResolvedValue({
        datos: [],
        paginacion: { pagina: 0, limite: 10, total: 0, totalPaginas: 0 },
      }),
    });

    const buscador = screen.getByRole("search", { name: "Buscar usuarios" });
    await evento.type(
      within(buscador).getByLabelText("Buscar usuarios"),
      "zzz",
    );
    await evento.click(
      within(buscador).getByRole("button", { name: "Buscar" }),
    );

    expect(await screen.findByText('Sin resultados para "zzz"')).toBeTruthy();
  });

  it("cambia el rol de un usuario", async () => {
    const evento = userEvent.setup();
    const administracion = montar();

    await screen.findByText("Ana Pérez");
    await evento.selectOptions(
      screen.getByLabelText("Rol de Ana Pérez"),
      "moderador",
    );

    await waitFor(() =>
      expect(administracion.cambiarRol).toHaveBeenCalledWith("u1", {
        rol: "moderador",
      }),
    );
    expect(
      await screen.findByText("Rol de Ana Pérez actualizado a moderador."),
    ).toBeTruthy();
  });

  it("avisa cuando intenta cambiar su propio rol", async () => {
    const evento = userEvent.setup();
    const administracion = montar({
      cambiarRol: vi.fn().mockRejectedValue({ status: 403 }),
    });

    await screen.findByText("Ana Pérez");
    await evento.selectOptions(
      screen.getByLabelText("Rol de Ana Pérez"),
      "admin",
    );

    expect(
      await screen.findByText("No puedes cambiar tu propio rol."),
    ).toBeTruthy();
    expect(administracion.cambiarRol).toHaveBeenCalled();
  });

  it("inhabilita una cuenta", async () => {
    const evento = userEvent.setup();
    const administracion = montar();

    await screen.findByText("Ana Pérez");
    await evento.click(screen.getByRole("button", { name: "Inhabilitar" }));

    await waitFor(() =>
      expect(administracion.cambiarHabilitacion).toHaveBeenCalledWith("u1", {
        habilitado: false,
      }),
    );
    expect(await screen.findByText("Inhabilitado")).toBeTruthy();
  });

  it("pagina con offset", async () => {
    const evento = userEvent.setup();
    const administracion = montar({ totalPaginas: 2 });

    await screen.findByText("Ana Pérez");
    await evento.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(administracion.listarUsuarios).toHaveBeenLastCalledWith({
        pagina: 1,
        limite: 10,
      }),
    );
  });

  it("no ofrece inhabilitarse ni cambiarse el rol a sí mismo", async () => {
    montar({
      datos: [{ ...usuario, id: "u9", nombre: "Admin" }],
    });

    await screen.findByText("Admin");
    expect(screen.getByText("Tú")).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Inhabilitar" })).toBeNull();
  });

  it("no muestra la lista a quien no es admin", async () => {
    montar({ rol: "moderador" });

    expect(
      await screen.findByRole("heading", {
        name: "No tienes acceso a administración",
      }),
    ).toBeTruthy();
  });

  it("redirige a entrar sin sesión", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/usuarios"]}>
        <SesionContexto.Provider
          value={{
            cliente: { administracion: {} },
            sesion: {},
            estado: { estado: "anonimo", usuario: null },
            restaurado: true,
          }}
        >
          <Routes>
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="/entrar" element={<h1>Entrar</h1>} />
          </Routes>
        </SesionContexto.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar();

    await screen.findByText("Ana Pérez");
    expect((await axe(document.body)).violations).toEqual([]);
  });
});
