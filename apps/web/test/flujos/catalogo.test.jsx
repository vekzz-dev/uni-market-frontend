// Flujo integrado de catálogo con MSW: primera página, cursor hacia adelante
// y fusión de resultados. Cliente generado real; solo la red está simulada.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Catalogo } from "../../src/pantallas/Catalogo.jsx";
import { SesionProvider } from "../../src/sesion/SesionContexto.jsx";

const BASE = "http://localhost:8080/v1";

const anuncio = (id, nombre) => ({
  id,
  nombre,
  precio: 45,
  categoriaId: null,
  vendedorId: "u1",
  vendedorNombre: "Ana P.",
  fechaCreacion: "2026-11-01T10:00:00Z",
  imagenUrls: [],
});

const urls = [];

const server = setupServer(
  http.get(`${BASE}/categorias`, () => HttpResponse.json({ datos: [] })),
  http.get(`${BASE}/anuncios`, ({ request }) => {
    const url = new URL(request.url);
    urls.push(url.search);
    const cursor = url.searchParams.get("cursor");
    if (!cursor) {
      return HttpResponse.json({
        datos: [anuncio("a1", "Calculadora")],
        paginacion: { cursorSiguiente: "c2", limite: 12 },
      });
    }
    return HttpResponse.json({
      datos: [anuncio("a2", "Bicicleta")],
      paginacion: { cursorSiguiente: null, limite: 12 },
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  urls.length = 0;
});
afterAll(() => server.close());

function montar() {
  return render(
    <SesionProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Catalogo />
      </MemoryRouter>
    </SesionProvider>,
  );
}

describe("flujo integrado de catálogo (MSW)", () => {
  it("pide la primera página y la siguiente con cursor, fusionando resultados", async () => {
    const usuario = userEvent.setup();
    await montar();

    expect(await screen.findByText("Calculadora")).toBeTruthy();
    expect(urls[0]).not.toContain("cursor=");

    await usuario.click(
      screen.getByRole("button", { name: "Cargar más anuncios" }),
    );

    expect(await screen.findByText("Bicicleta")).toBeTruthy();
    await waitFor(() =>
      expect(urls.some((q) => q.includes("cursor=c2"))).toBe(true),
    );
    expect(screen.getByText("Calculadora")).toBeTruthy();
  });
});
