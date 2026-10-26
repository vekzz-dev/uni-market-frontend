import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MisAnuncios } from "../src/pantallas/MisAnuncios.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const pendiente = {
  id: "a1",
  nombre: "Calculadora",
  precio: 45,
  estado: "inactivo",
  estadoRevision: "pendiente",
  motivoRechazo: null,
  imagenUrls: [],
};
const aprobado = {
  id: "a2",
  nombre: "Bicicleta",
  precio: 210,
  estado: "disponible",
  estadoRevision: "aprobado",
  motivoRechazo: null,
  imagenUrls: [],
};
const rechazado = {
  id: "a3",
  nombre: "Libro",
  precio: 28,
  estado: "inactivo",
  estadoRevision: "rechazado",
  motivoRechazo: "Las fotos no muestran el producto.",
  imagenUrls: [],
};

function montar({
  datos = [pendiente, aprobado, rechazado],
  totalPaginas = 1,
  acciones = {},
} = {}) {
  const anuncios = {
    listarMisAnuncios: vi.fn().mockResolvedValue({
      datos,
      paginacion: { pagina: 0, limite: 10, total: datos.length, totalPaginas },
    }),
    alternarVisibilidad: vi.fn().mockResolvedValue({}),
    marcarVendido: vi.fn().mockResolvedValue({}),
    darDeBajaAnuncio: vi.fn().mockResolvedValue(undefined),
    ...acciones,
  };
  const cliente = { anuncios };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = { estado: "autenticado", usuario: { nombre: "Ana" } };
  render(
    <MemoryRouter initialEntries={["/mis-anuncios"]}>
      <SesionContexto.Provider value={{ cliente, sesion, estado }}>
        <Routes>
          <Route path="/mis-anuncios" element={<MisAnuncios />} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
  return anuncios;
}

describe("pantalla Mis anuncios", () => {
  it("muestra los anuncios con su estado y motivo", async () => {
    montar();

    expect(await screen.findByText("Calculadora")).toBeTruthy();
    expect(screen.getByText("Pendiente")).toBeTruthy();
    expect(screen.getByText("Aprobado")).toBeTruthy();
    expect(screen.getByText("Rechazado")).toBeTruthy();
    expect(screen.getByText("Las fotos no muestran el producto.")).toBeTruthy();
  });

  it("oculta un anuncio aprobado y recarga", async () => {
    const usuario = userEvent.setup();
    const anuncios = montar();

    await screen.findByText("Bicicleta");
    await usuario.click(screen.getByRole("button", { name: "Ocultar" }));

    await waitFor(() =>
      expect(anuncios.alternarVisibilidad).toHaveBeenCalledWith("a2", {
        visible: false,
      }),
    );
    await waitFor(() =>
      expect(anuncios.listarMisAnuncios).toHaveBeenCalledTimes(2),
    );
  });

  it("da de baja tras confirmar", async () => {
    const usuario = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const anuncios = montar();

    await screen.findByText("Calculadora");
    const fila = screen.getByText("Calculadora").closest("li");
    await usuario.click(within(fila).getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(anuncios.darDeBajaAnuncio).toHaveBeenCalledWith("a1"),
    );
  });

  it("pide la página siguiente con offset", async () => {
    const usuario = userEvent.setup();
    const anuncios = montar({ totalPaginas: 2 });

    await screen.findByText("Calculadora");
    await usuario.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() =>
      expect(anuncios.listarMisAnuncios).toHaveBeenLastCalledWith({
        pagina: 1,
        limite: 10,
      }),
    );
  });

  it("redirige a entrar sin sesión", async () => {
    const cliente = { anuncios: { listarMisAnuncios: vi.fn() } };
    render(
      <MemoryRouter initialEntries={["/mis-anuncios"]}>
        <SesionContexto.Provider
          value={{
            cliente,
            sesion: {},
            estado: { estado: "anonimo", usuario: null },
          }}
        >
          <Routes>
            <Route path="/mis-anuncios" element={<MisAnuncios />} />
            <Route path="/entrar" element={<h1>Entrar</h1>} />
          </Routes>
        </SesionContexto.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });
});
