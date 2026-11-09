import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { Mensajes } from "../src/pantallas/Mensajes.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const conversacion = {
  id: "c1",
  anuncioId: "a1",
  compradorId: "u1",
  vendedorId: "u2",
  fechaCreacion: "2026-11-01T10:00:00Z",
  fechaActualizacion: "2026-11-09T10:00:00Z",
  anuncio: {
    id: "a1",
    nombre: "Bicicleta de montaña",
    precio: 210,
    vendedorNombre: "Ana P.",
    imagenUrls: [],
  },
  ultimoMensaje: {
    id: "m1",
    texto: "¿Sigue disponible?",
    remitenteId: "u2",
    fechaCreacion: "2026-11-09T10:00:00Z",
  },
  noLeidos: 2,
};

function montar({
  datos = [conversacion],
  totalPaginas = 1,
  listarMisConversaciones,
} = {}) {
  const conversaciones = {
    listarMisConversaciones:
      listarMisConversaciones ??
      vi.fn().mockResolvedValue({
        datos,
        paginacion: {
          pagina: 0,
          limite: 10,
          total: datos.length,
          totalPaginas,
        },
      }),
  };
  const cliente = { conversaciones };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u1", nombre: "Ana" },
  };

  render(
    <MemoryRouter initialEntries={["/mensajes"]}>
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Routes>
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/mensajes/:id" element={<h1>Hilo</h1>} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );

  return conversaciones;
}

describe("pantalla Mensajes", () => {
  it("lista las conversaciones con último mensaje y no leídos", async () => {
    montar();

    expect(await screen.findByText("Bicicleta de montaña")).toBeTruthy();
    expect(screen.getByText("¿Sigue disponible?")).toBeTruthy();
    expect(screen.getByText("Compra · Ana P.")).toBeTruthy();
    expect(screen.getByLabelText("2 sin leer")).toBeTruthy();
  });

  it("enlaza cada conversación con su hilo", async () => {
    montar();

    const fila = (await screen.findByText("Bicicleta de montaña")).closest("a");
    expect(fila.getAttribute("href")).toBe("/mensajes/c1");
  });

  it("pide la página siguiente con offset", async () => {
    const usuario = userEvent.setup();
    const conversaciones = montar({ totalPaginas: 3 });

    await screen.findByText("Bicicleta de montaña");
    await usuario.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(conversaciones.listarMisConversaciones).toHaveBeenLastCalledWith({
        pagina: 1,
        limite: 10,
      }),
    );
  });

  it("muestra el vacío cuando no hay conversaciones", async () => {
    montar({ datos: [] });

    expect(
      await screen.findByText("Aún no tienes conversaciones"),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Explorar catálogo" }),
    ).toBeTruthy();
  });

  it("muestra el error y permite reintentar", async () => {
    const usuario = userEvent.setup();
    const listar = vi
      .fn()
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValueOnce({
        datos: [conversacion],
        paginacion: { pagina: 0, limite: 10, total: 1, totalPaginas: 1 },
      });
    montar({ listarMisConversaciones: listar });

    expect(
      await screen.findByText(
        "Algo falló de nuestro lado. Vuelve a intentarlo.",
      ),
    ).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Bicicleta de montaña")).toBeTruthy();
  });

  it("redirige a entrar sin sesión", async () => {
    const cliente = { conversaciones: {} };
    render(
      <MemoryRouter initialEntries={["/mensajes"]}>
        <SesionContexto.Provider
          value={{
            cliente,
            sesion: {},
            estado: { estado: "anonimo", usuario: null },
            restaurado: true,
          }}
        >
          <Routes>
            <Route path="/mensajes" element={<Mensajes />} />
            <Route path="/entrar" element={<h1>Entrar</h1>} />
          </Routes>
        </SesionContexto.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar();

    await screen.findByText("Bicicleta de montaña");
    expect((await axe(document.body)).violations).toEqual([]);
  });
});
