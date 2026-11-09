import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { EditarAnuncio } from "../src/pantallas/EditarAnuncio.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const anuncio = {
  id: "a2",
  nombre: "Bicicleta",
  precio: 210,
  descripcion: "Rodada 29",
  categoriaId: 3,
  imagenUrls: [],
  estado: "disponible",
  estadoRevision: "aprobado",
  retraido: false,
};

function montar({
  editarAnuncio = vi.fn(),
  reemplazarImagenes = vi.fn(),
  leerMiAnuncio = vi.fn().mockResolvedValue(anuncio),
} = {}) {
  const cliente = {
    categorias: {
      listarCategorias: vi.fn().mockResolvedValue({
        datos: [{ id: 3, nombre: "Deportes", orden: 1 }],
      }),
    },
    anuncios: { leerMiAnuncio, editarAnuncio, reemplazarImagenes },
  };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = { estado: "autenticado", usuario: { nombre: "Ana" } };

  // Sin `state` de navegación a propósito: es el caso de recargar la URL.
  render(
    <MemoryRouter initialEntries={["/mis-anuncios/a2/editar"]}>
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Routes>
          <Route path="/mis-anuncios/:id/editar" element={<EditarAnuncio />} />
          <Route path="/mis-anuncios" element={<h1>Mis anuncios</h1>} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );

  return { leerMiAnuncio };
}

describe("pantalla Editar anuncio", () => {
  it("carga el anuncio por id sin depender del estado de navegación", async () => {
    const { leerMiAnuncio } = montar();

    expect(await screen.findByDisplayValue("Bicicleta")).toBeTruthy();
    expect(leerMiAnuncio).toHaveBeenCalledWith("a2");
    expect(screen.getByLabelText("Precio (USD)").value).toBe("210");
    expect(screen.getByLabelText("Descripción").value).toBe("Rodada 29");
  });

  it("guarda los cambios y vuelve a revisión", async () => {
    const usuario = userEvent.setup();
    const editarAnuncio = vi.fn().mockResolvedValue({});
    montar({ editarAnuncio });

    const precio = await screen.findByLabelText("Precio (USD)");
    await usuario.clear(precio);
    await usuario.type(precio, "200");
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    await waitFor(() =>
      expect(editarAnuncio).toHaveBeenCalledWith(
        "a2",
        expect.objectContaining({ nombre: "Bicicleta", precio: 200 }),
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "Anuncio actualizado" }),
    ).toBeTruthy();
  });

  it("valida el precio antes de enviar", async () => {
    const usuario = userEvent.setup();
    const editarAnuncio = vi.fn();
    montar({ editarAnuncio });

    const precio = await screen.findByLabelText("Precio (USD)");
    await usuario.clear(precio);
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    expect(screen.getByText("Escribe un precio.")).toBeTruthy();
    expect(editarAnuncio).not.toHaveBeenCalled();
  });

  it("muestra el desenlace de no encontrado con 404", async () => {
    montar({
      leerMiAnuncio: vi.fn().mockRejectedValue({ status: 404 }),
    });

    expect(
      await screen.findByRole("heading", {
        name: "No encontramos ese anuncio",
      }),
    ).toBeTruthy();
  });

  it("redirige a entrar cuando la sesión terminó", async () => {
    montar({
      leerMiAnuncio: vi.fn().mockRejectedValue({ status: 401 }),
    });

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("reemplaza las imágenes cuando se eligen nuevas", async () => {
    const usuario = userEvent.setup();
    const editarAnuncio = vi.fn().mockResolvedValue({});
    const reemplazarImagenes = vi.fn().mockResolvedValue({});
    montar({ editarAnuncio, reemplazarImagenes });

    await screen.findByLabelText("Precio (USD)");
    const archivo = new File(["x"], "nueva.png", { type: "image/png" });
    await usuario.upload(screen.getByLabelText("Imágenes"), archivo);
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    await waitFor(() => expect(reemplazarImagenes).toHaveBeenCalled());
    expect(reemplazarImagenes.mock.calls[0][0]).toBe("a2");
    expect(reemplazarImagenes.mock.calls[0][1]).toHaveLength(1);
    expect(
      await screen.findByRole("heading", { name: "Anuncio actualizado" }),
    ).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar();

    await screen.findByLabelText("Precio (USD)");
    expect((await axe(document.body)).violations).toEqual([]);
  });
});
