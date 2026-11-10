import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { Moderacion } from "../src/pantallas/Moderacion.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const pendiente = {
  id: "a1",
  nombre: "Calculadora Casio fx-991",
  precio: 45,
  vendedorId: "u1",
  vendedorNombre: "Ana P.",
  fechaCreacion: "2026-11-01T10:00:00Z",
  fechaActualizacion: "2026-11-01T10:00:00Z",
  estado: "disponible",
  estadoRevision: "pendiente",
  imagenUrls: [],
};

const aprobado = {
  ...pendiente,
  id: "a2",
  nombre: "Bicicleta rodada 29",
  estadoRevision: "aprobado",
};

function montar({
  datos = [pendiente],
  totalPaginas = 1,
  rol = "moderador",
  listarColaModeracion,
  decidirRevision = vi.fn().mockResolvedValue({ ...pendiente }),
} = {}) {
  const moderacion = {
    listarColaModeracion:
      listarColaModeracion ??
      vi.fn().mockResolvedValue({
        datos,
        paginacion: {
          pagina: 0,
          limite: 10,
          total: datos.length,
          totalPaginas,
        },
      }),
    decidirRevision,
  };
  const cliente = { moderacion };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u9", nombre: "Mod", rol },
  };

  render(
    <MemoryRouter initialEntries={["/moderacion"]}>
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Routes>
          <Route path="/moderacion" element={<Moderacion />} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );

  return moderacion;
}

describe("pantalla Moderación", () => {
  it("lista la cola pendiente con vendedor y fecha", async () => {
    const moderacion = montar();

    expect(await screen.findByText("Calculadora Casio fx-991")).toBeTruthy();
    expect(screen.getByText(/Vendedor: Ana P\./)).toBeTruthy();
    expect(moderacion.listarColaModeracion).toHaveBeenCalledWith({
      estadoRevision: "pendiente",
      pagina: 0,
      limite: 10,
    });
  });

  it("filtra por aprobados y ofrece retraer", async () => {
    const usuario = userEvent.setup();
    const moderacion = montar({ datos: [aprobado] });

    await screen.findByText("Bicicleta rodada 29");
    await usuario.click(screen.getByRole("button", { name: "Aprobados" }));

    await waitFor(() =>
      expect(moderacion.listarColaModeracion).toHaveBeenLastCalledWith({
        estadoRevision: "aprobado",
        pagina: 0,
        limite: 10,
      }),
    );
    expect(screen.getByRole("button", { name: "Retraer" })).toBeTruthy();
  });

  it("aprueba sin pedir motivo", async () => {
    const usuario = userEvent.setup();
    const moderacion = montar();

    await screen.findByText("Calculadora Casio fx-991");
    await usuario.click(screen.getByRole("button", { name: "Aprobar" }));

    await waitFor(() =>
      expect(moderacion.decidirRevision).toHaveBeenCalledWith("a1", {
        decision: "aprobar",
      }),
    );
    expect(await screen.findByText("Anuncio aprobado.")).toBeTruthy();
  });

  it("no rechaza sin motivo", async () => {
    const usuario = userEvent.setup();
    const moderacion = montar();

    await screen.findByText("Calculadora Casio fx-991");
    await usuario.click(screen.getByRole("button", { name: "Rechazar" }));
    await usuario.click(
      screen.getByRole("button", { name: "Confirmar rechazar" }),
    );

    expect(
      await screen.findByText("Explica el motivo de la decisión."),
    ).toBeTruthy();
    expect(moderacion.decidirRevision).not.toHaveBeenCalled();
  });

  it("rechaza con motivo", async () => {
    const usuario = userEvent.setup();
    const moderacion = montar();

    await screen.findByText("Calculadora Casio fx-991");
    await usuario.click(screen.getByRole("button", { name: "Rechazar" }));
    await usuario.type(
      screen.getByLabelText("Motivo del rechazo"),
      "Las fotos no muestran el producto.",
    );
    await usuario.click(
      screen.getByRole("button", { name: "Confirmar rechazar" }),
    );

    await waitFor(() =>
      expect(moderacion.decidirRevision).toHaveBeenCalledWith("a1", {
        decision: "rechazar",
        motivoRechazo: "Las fotos no muestran el producto.",
      }),
    );
    expect(await screen.findByText("Anuncio rechazado.")).toBeTruthy();
  });

  it("muestra el 403 cuando el anuncio es propio", async () => {
    const usuario = userEvent.setup();
    const moderacion = montar({
      decidirRevision: vi.fn().mockRejectedValue({ status: 403 }),
    });

    await screen.findByText("Calculadora Casio fx-991");
    await usuario.click(screen.getByRole("button", { name: "Rechazar" }));
    await usuario.type(
      screen.getByLabelText("Motivo del rechazo"),
      "Motivo válido.",
    );
    await usuario.click(
      screen.getByRole("button", { name: "Confirmar rechazar" }),
    );

    expect(
      await screen.findByText("No tienes permiso para esta acción."),
    ).toBeTruthy();
    expect(moderacion.decidirRevision).toHaveBeenCalled();
  });

  it("muestra el vacío de la cola", async () => {
    montar({ datos: [] });

    expect(await screen.findByText("No hay anuncios pendientes")).toBeTruthy();
  });

  it("no muestra la cola a quien no es moderador", async () => {
    montar({ rol: "miembro" });

    expect(
      await screen.findByRole("heading", {
        name: "No tienes acceso a moderación",
      }),
    ).toBeTruthy();
  });

  it("redirige a entrar sin sesión", async () => {
    render(
      <MemoryRouter initialEntries={["/moderacion"]}>
        <SesionContexto.Provider
          value={{
            cliente: { moderacion: {} },
            sesion: {},
            estado: { estado: "anonimo", usuario: null },
            restaurado: true,
          }}
        >
          <Routes>
            <Route path="/moderacion" element={<Moderacion />} />
            <Route path="/entrar" element={<h1>Entrar</h1>} />
          </Routes>
        </SesionContexto.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar();

    await screen.findByText("Calculadora Casio fx-991");
    expect((await axe(document.body)).violations).toEqual([]);
  });
});
