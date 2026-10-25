import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { ApiError } from "@uni-market/api-client";
import { Detalle } from "../src/pantallas/Detalle.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const detalle = {
  id: "a1",
  nombre: "Calculadora científica",
  precio: 45,
  descripcion: "Con funda y manual.",
  categoriaId: 3,
  vendedorId: "u1",
  vendedorNombre: "Ana P.",
  fechaCreacion: "2026-10-20T10:00:00Z",
  imagenUrls: [],
};

function montar(leerAnuncio) {
  const cliente = {
    catalogo: { leerAnuncio },
    categorias: {
      listarCategorias: vi.fn().mockResolvedValue({
        datos: [{ id: 3, nombre: "Electrónica", orden: 1 }],
      }),
    },
  };
  return render(
    <MemoryRouter initialEntries={["/anuncios/a1"]}>
      <SesionContexto.Provider
        value={{
          cliente,
          sesion: {},
          estado: { estado: "anonimo", usuario: null },
        }}
      >
        <Routes>
          <Route path="/anuncios/:id" element={<Detalle />} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

describe("pantalla Detalle", () => {
  it("muestra los datos del anuncio y la categoría", async () => {
    montar(vi.fn().mockResolvedValue(detalle));

    expect(
      await screen.findByRole("heading", { name: "Calculadora científica" }),
    ).toBeTruthy();
    expect(screen.getByText("$45.00")).toBeTruthy();
    expect(screen.getByText("Electrónica")).toBeTruthy();
    expect(screen.getByText("Vendedor: Ana P.")).toBeTruthy();
  });

  it("trata el 404 como anuncio no disponible", async () => {
    montar(
      vi.fn().mockRejectedValue(new ApiError("No encontrado", { status: 404 })),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Este anuncio ya no está disponible",
      }),
    ).toBeTruthy();
  });

  it("muestra el error de carga y reintenta", async () => {
    const usuario = userEvent.setup();
    const leerAnuncio = vi
      .fn()
      .mockRejectedValueOnce(new ApiError("caído", { status: 500 }))
      .mockResolvedValueOnce(detalle);
    montar(leerAnuncio);

    expect(
      await screen.findByRole("heading", {
        name: "No pudimos cargar el anuncio",
      }),
    ).toBeTruthy();
    await usuario.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findByRole("heading", { name: "Calculadora científica" }),
    ).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = montar(vi.fn().mockResolvedValue(detalle));

    await screen.findByRole("heading", { name: "Calculadora científica" });
    expect((await axe(container)).violations).toEqual([]);
  });
});
