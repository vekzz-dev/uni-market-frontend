import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { ApiError } from "@uni-market/api-client";
import { AdminCategorias } from "../src/pantallas/AdminCategorias.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const categoria = {
  id: 1,
  nombre: "Electrónica",
  descripcion: "Dispositivos y accesorios",
  icono: "cpu",
  orden: 1,
};

function montar({
  datos = [categoria],
  rol = "moderador",
  categorias = {},
} = {}) {
  const base = {
    listarCategorias: vi.fn().mockResolvedValue({ datos }),
    crearCategoria: vi.fn().mockResolvedValue({ ...categoria, id: 2 }),
    actualizarCategoria: vi.fn().mockResolvedValue(categoria),
    eliminarCategoria: vi.fn().mockResolvedValue(undefined),
    ...categorias,
  };
  const cliente = { categorias: base };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u9", nombre: "Mod", rol },
  };

  render(
    <MemoryRouter initialEntries={["/admin/categorias"]}>
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Routes>
          <Route path="/admin/categorias" element={<AdminCategorias />} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );

  return base;
}

describe("pantalla Admin categorías", () => {
  it("lista las categorías con orden y descripción", async () => {
    montar();

    expect(await screen.findByText("Electrónica")).toBeTruthy();
    expect(screen.getByText("Dispositivos y accesorios")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("crea una categoría y recarga la lista", async () => {
    const evento = userEvent.setup();
    const categorias = montar();

    await screen.findByText("Electrónica");
    await evento.click(screen.getByRole("button", { name: "Nueva categoría" }));
    await evento.type(screen.getByLabelText("Nombre"), "Instrumentos");
    await evento.type(screen.getByLabelText("Icono"), "guitar");
    await evento.click(
      screen.getByRole("button", { name: "Guardar categoría" }),
    );

    await waitFor(() =>
      expect(categorias.crearCategoria).toHaveBeenCalledWith({
        nombre: "Instrumentos",
        descripcion: null,
        icono: "guitar",
      }),
    );
    expect(await screen.findByText("Categoría creada.")).toBeTruthy();
    await waitFor(() =>
      expect(categorias.listarCategorias).toHaveBeenCalledTimes(2),
    );
  });

  it("no crea sin nombre", async () => {
    const evento = userEvent.setup();
    const categorias = montar();

    await screen.findByText("Electrónica");
    await evento.click(screen.getByRole("button", { name: "Nueva categoría" }));
    await evento.click(
      screen.getByRole("button", { name: "Guardar categoría" }),
    );

    expect(screen.getByText("Escribe el nombre de la categoría.")).toBeTruthy();
    expect(categorias.crearCategoria).not.toHaveBeenCalled();
  });

  it("muestra el 409 del nombre duplicado", async () => {
    const evento = userEvent.setup();
    const categorias = montar({
      categorias: {
        crearCategoria: vi.fn().mockRejectedValue(
          new ApiError("Conflicto", {
            status: 409,
            problem: { detail: "Ya existe una categoría con ese nombre." },
          }),
        ),
      },
    });

    await screen.findByText("Electrónica");
    await evento.click(screen.getByRole("button", { name: "Nueva categoría" }));
    await evento.type(screen.getByLabelText("Nombre"), "Electrónica");
    await evento.click(
      screen.getByRole("button", { name: "Guardar categoría" }),
    );

    expect(
      await screen.findByText("Ya existe una categoría con ese nombre."),
    ).toBeTruthy();
    expect(categorias.crearCategoria).toHaveBeenCalled();
  });

  it("edita una categoría existente", async () => {
    const evento = userEvent.setup();
    const categorias = montar();

    await screen.findByText("Electrónica");
    await evento.click(screen.getByRole("button", { name: "Editar" }));

    const nombre = screen.getByLabelText("Nombre");
    expect(nombre.value).toBe("Electrónica");
    await evento.clear(nombre);
    await evento.type(nombre, "Electrónica y más");
    await evento.click(
      screen.getByRole("button", { name: "Guardar categoría" }),
    );

    await waitFor(() =>
      expect(categorias.actualizarCategoria).toHaveBeenCalledWith(1, {
        nombre: "Electrónica y más",
        descripcion: "Dispositivos y accesorios",
        icono: "cpu",
      }),
    );
  });

  it("elimina tras confirmar", async () => {
    const evento = userEvent.setup();
    const categorias = montar();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    await screen.findByText("Electrónica");
    await evento.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(categorias.eliminarCategoria).toHaveBeenCalledWith(1),
    );
    expect(await screen.findByText("Categoría eliminada.")).toBeTruthy();
  });

  it("no elimina si no se confirma", async () => {
    const evento = userEvent.setup();
    const categorias = montar();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    await screen.findByText("Electrónica");
    await evento.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(categorias.eliminarCategoria).not.toHaveBeenCalled();
  });

  it("no muestra la gestión a un miembro", async () => {
    montar({ rol: "miembro" });

    expect(
      await screen.findByRole("heading", {
        name: "No tienes acceso a categorías",
      }),
    ).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar();

    await screen.findByText("Electrónica");
    expect((await axe(document.body)).violations).toEqual([]);
  });
});

describe("navegación entre secciones desde categorías", () => {
  it("llega a usuarios y moderación", async () => {
    montar({ rol: "admin" });

    expect(await screen.findByRole("link", { name: "Usuarios" })).toBeTruthy();
    expect(
      await screen.findByRole("link", { name: "Moderación" }),
    ).toBeTruthy();
  });
});
