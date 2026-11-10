import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { Conversacion } from "../src/pantallas/Conversacion.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const anuncio = {
  id: "a1",
  nombre: "Bicicleta de montaña",
  precio: 210,
  vendedorNombre: "Ana P.",
  imagenUrls: [],
};

const recibido = {
  id: "m1",
  conversacionId: "c1",
  remitenteId: "u2",
  texto: "Hola, ¿sigue disponible?",
  leido: true,
  fechaCreacion: "2026-11-09T10:24:00Z",
};

const propio = {
  id: "m2",
  conversacionId: "c1",
  remitenteId: "u1",
  texto: "Sí, sigue disponible.",
  leido: true,
  fechaCreacion: "2026-11-09T10:26:00Z",
};

function montar({
  leerConversacion = vi.fn().mockResolvedValue({
    id: "c1",
    anuncioId: "a1",
    compradorId: "u1",
    vendedorId: "u2",
    contraparteNombre: "Ana P.",
    anuncio,
    noLeidos: 1,
  }),
  listarMensajes = vi.fn().mockResolvedValue({
    datos: [propio, recibido],
    paginacion: { cursorSiguiente: null },
  }),
  enviarMensaje = vi.fn().mockResolvedValue({
    id: "m3",
    conversacionId: "c1",
    remitenteId: "u1",
    texto: "¿La dejas en 180?",
    leido: false,
    fechaCreacion: "2026-11-09T10:30:00Z",
  }),
  marcarLecturas = vi.fn().mockResolvedValue(undefined),
} = {}) {
  const cliente = {
    conversaciones: { leerConversacion },
    mensajes: { listarMensajes, enviarMensaje, marcarLecturas },
  };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u1", nombre: "Ana" },
  };

  render(
    <MemoryRouter initialEntries={["/mensajes/c1"]}>
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Routes>
          <Route path="/mensajes/:id" element={<Conversacion />} />
          <Route path="/mensajes" element={<h1>Mis mensajes</h1>} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );

  return { mensajes: cliente.mensajes, conversaciones: cliente.conversaciones };
}

describe("pantalla Conversación", () => {
  it("carga el historial y marca la lectura una sola vez", async () => {
    const { mensajes } = montar();

    expect(await screen.findByText("Hola, ¿sigue disponible?")).toBeTruthy();
    expect(screen.getByText("Sí, sigue disponible.")).toBeTruthy();
    expect(screen.getByText("Bicicleta de montaña")).toBeTruthy();

    await waitFor(() =>
      expect(mensajes.marcarLecturas).toHaveBeenCalledWith("c1"),
    );
    expect(mensajes.marcarLecturas).toHaveBeenCalledTimes(1);
  });

  it("envía un mensaje y lo añade al historial", async () => {
    const usuario = userEvent.setup();
    const { mensajes } = montar();

    await screen.findByText("Hola, ¿sigue disponible?");
    await usuario.type(screen.getByLabelText("Mensaje"), "¿La dejas en 180?");
    await usuario.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() =>
      expect(mensajes.enviarMensaje).toHaveBeenCalledWith("c1", {
        texto: "¿La dejas en 180?",
      }),
    );
    expect(await screen.findByText("¿La dejas en 180?")).toBeTruthy();
    expect(screen.getByLabelText("Mensaje").value).toBe("");
  });

  it("no envía un mensaje vacío", async () => {
    const usuario = userEvent.setup();
    const { mensajes } = montar();

    await screen.findByText("Hola, ¿sigue disponible?");
    await usuario.type(screen.getByLabelText("Mensaje"), "   ");
    await usuario.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mensajes.enviarMensaje).not.toHaveBeenCalled();
  });

  it("carga mensajes anteriores con el cursor", async () => {
    const usuario = userEvent.setup();
    const listarMensajes = vi
      .fn()
      .mockResolvedValueOnce({
        datos: [propio],
        paginacion: { cursorSiguiente: "c0" },
      })
      .mockResolvedValueOnce({
        datos: [recibido],
        paginacion: { cursorSiguiente: null },
      });
    montar({ listarMensajes });

    await screen.findByText("Sí, sigue disponible.");
    await usuario.click(
      screen.getByRole("button", { name: "Cargar anteriores" }),
    );

    await waitFor(() =>
      expect(listarMensajes).toHaveBeenLastCalledWith("c1", {
        cursor: "c0",
        limite: 30,
      }),
    );
    expect(await screen.findByText("Hola, ¿sigue disponible?")).toBeTruthy();
  });

  it("muestra el desenlace cuando no participa o no existe", async () => {
    montar({
      leerConversacion: vi.fn().mockRejectedValue({ status: 403 }),
    });

    expect(
      await screen.findByRole("heading", {
        name: "No encontramos esa conversación",
      }),
    ).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar();

    await screen.findByText("Hola, ¿sigue disponible?");
    expect((await axe(document.body)).violations).toEqual([]);
  });
});
