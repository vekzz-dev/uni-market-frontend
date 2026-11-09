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
  retraido: false,
  motivoRechazo: "Las fotos no muestran el producto.",
  imagenUrls: [],
};
const retraido = {
  id: "a4",
  nombre: "Audífonos",
  precio: 60,
  estado: "inactivo",
  estadoRevision: "rechazado",
  retraido: true,
  motivoRechazo: "La aprobación se revocó por moderación.",
  imagenUrls: [],
};

function montar({
  datos = [pendiente, aprobado, rechazado, retraido],
  totalPaginas = 1,
  acciones = {},
  restaurado = true,
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
      <SesionContexto.Provider value={{ cliente, sesion, estado, restaurado }}>
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
    expect(screen.getByText("Retraído")).toBeTruthy();
    expect(screen.getByText("Las fotos no muestran el producto.")).toBeTruthy();
    expect(screen.getByText("En revisión")).toBeTruthy();
  });

  it("enlaza cada anuncio con su pantalla de edición", async () => {
    montar();

    const fila = (await screen.findByText("Calculadora")).closest("li");
    expect(
      within(fila).getByRole("link", { name: "Editar" }).getAttribute("href"),
    ).toBe("/mis-anuncios/a1/editar");
  });

  it("filtra el panel por estado de revisión", async () => {
    const usuario = userEvent.setup();
    const anuncios = montar();

    await screen.findByText("Calculadora");
    await usuario.click(screen.getByRole("button", { name: "Pendientes" }));

    await waitFor(() =>
      expect(anuncios.listarMisAnuncios).toHaveBeenLastCalledWith({
        pagina: 0,
        limite: 10,
        estadoRevision: "pendiente",
      }),
    );
    expect(
      screen
        .getByRole("button", { name: "Pendientes" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("vuelve a la primera página al cambiar de filtro", async () => {
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

    await usuario.click(screen.getByRole("button", { name: "Aprobados" }));
    await waitFor(() =>
      expect(anuncios.listarMisAnuncios).toHaveBeenLastCalledWith({
        pagina: 0,
        limite: 10,
        estadoRevision: "aprobado",
      }),
    );
  });

  it("distingue el vacío filtrado del panel sin anuncios", async () => {
    const usuario = userEvent.setup();
    montar({ datos: [] });

    expect(await screen.findByText("Aún no publicaste nada")).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: "Rechazados" }));
    expect(await screen.findByText("Sin anuncios con ese estado")).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: "Ver todos" }));
    expect(await screen.findByText("Aún no publicaste nada")).toBeTruthy();
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
            restaurado: true,
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

  it("no expulsa a entrar mientras la sesión se restaura", async () => {
    const cliente = { anuncios: { listarMisAnuncios: vi.fn() } };
    render(
      <MemoryRouter initialEntries={["/mis-anuncios"]}>
        <SesionContexto.Provider
          value={{
            cliente,
            sesion: {},
            estado: { estado: "anonimo", usuario: null },
            restaurado: false,
          }}
        >
          <Routes>
            <Route path="/mis-anuncios" element={<MisAnuncios />} />
            <Route path="/entrar" element={<h1>Entrar</h1>} />
          </Routes>
        </SesionContexto.Provider>
      </MemoryRouter>,
    );

    await new Promise((resolver) => setTimeout(resolver, 0));
    expect(screen.queryByRole("heading", { name: "Entrar" })).toBeNull();
  });
});
