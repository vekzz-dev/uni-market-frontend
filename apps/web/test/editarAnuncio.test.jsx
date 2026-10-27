import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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
};

function montar({ editarAnuncio, reemplazarImagenes, conAnuncio = true } = {}) {
  const cliente = {
    categorias: {
      listarCategorias: vi.fn().mockResolvedValue({
        datos: [{ id: 3, nombre: "Deportes", orden: 1 }],
      }),
    },
    anuncios: { editarAnuncio, reemplazarImagenes },
  };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = { estado: "autenticado", usuario: { nombre: "Ana" } };
  const entrada = conAnuncio
    ? { pathname: "/mis-anuncios/a2/editar", state: { anuncio } }
    : { pathname: "/mis-anuncios/a2/editar" };

  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <SesionContexto.Provider value={{ cliente, sesion, estado }}>
        <Routes>
          <Route path="/mis-anuncios/:id/editar" element={<EditarAnuncio />} />
          <Route path="/mis-anuncios" element={<h1>Mis anuncios</h1>} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

describe("pantalla Editar anuncio", () => {
  it("precarga el anuncio y guarda los cambios", async () => {
    const usuario = userEvent.setup();
    const editarAnuncio = vi.fn().mockResolvedValue({});
    const reemplazarImagenes = vi.fn().mockResolvedValue({});
    montar({ editarAnuncio, reemplazarImagenes });

    const precio = screen.getByLabelText("Precio (USD)");
    expect(precio.value).toBe("210");
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

    const precio = screen.getByLabelText("Precio (USD)");
    await usuario.clear(precio);
    await usuario.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    expect(screen.getByText("Escribe un precio.")).toBeTruthy();
    expect(editarAnuncio).not.toHaveBeenCalled();
  });

  it("avisa si se abre sin datos del anuncio", () => {
    montar({ editarAnuncio: vi.fn(), conAnuncio: false });

    expect(
      screen.getByRole("heading", { name: "No pudimos abrir el anuncio" }),
    ).toBeTruthy();
  });

  it("reemplaza las imágenes cuando se eligen nuevas", async () => {
    const usuario = userEvent.setup();
    const editarAnuncio = vi.fn().mockResolvedValue({});
    const reemplazarImagenes = vi.fn().mockResolvedValue({});
    montar({ editarAnuncio, reemplazarImagenes });

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
});
