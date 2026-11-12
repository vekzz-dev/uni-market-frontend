import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  const cliente = {
    moderacion,
    categorias: {
      listarCategorias: vi.fn().mockResolvedValue({
        datos: [{ id: 3, nombre: "Electrónica" }],
      }),
    },
  };
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

describe("detalle del anuncio en la cola", () => {
  const conDetalle = {
    ...pendiente,
    descripcion: "Calculadora en buen estado, incluye estuche.",
    imagenUrls: ["/media/uno.png", "/media/dos.png"],
  };

  it("abre la descripción y las imágenes antes de decidir", async () => {
    const usuario = userEvent.setup();
    montar({ datos: [conDetalle] });

    // Cerrado por defecto: la cola no obliga a leer todo
    expect(screen.queryByText(/incluye estuche/)).toBeNull();

    await usuario.click(
      await screen.findByRole("button", { name: "Ver detalle" }),
    );

    expect(await screen.findByText(/incluye estuche/)).toBeTruthy();
    const galeria = screen.getByLabelText("Imágenes del anuncio");
    // `resolverUrlMedia` antepone el origen de la API a las rutas relativas
    const rutas = [...galeria.querySelectorAll("img")].map((i) =>
      i.getAttribute("src").replace(/^https?:\/\/[^/]+/, ""),
    );
    expect(rutas).toEqual(["/media/uno.png", "/media/dos.png"]);

    // Y se puede volver a cerrar
    await usuario.click(
      screen.getByRole("button", { name: "Ocultar detalle" }),
    );
    expect(screen.queryByText(/incluye estuche/)).toBeNull();
  });
});

describe("detalle completo del anuncio", () => {
  const completo = {
    ...pendiente,
    categoriaId: 3,
    descripcion: "Calculadora en buen estado, incluye estuche.",
    imagenUrls: ["/media/uno.png", "/media/dos.png"],
    fechaActualizacion: "2026-11-02T09:30:00Z",
  };

  async function abrir(usuario) {
    await usuario.click(
      await screen.findByRole("button", { name: "Ver detalle" }),
    );
  }

  it("traduce la categoría a su nombre, no muestra el id", async () => {
    const usuario = userEvent.setup();
    montar({ datos: [completo] });
    await abrir(usuario);

    expect(await screen.findByText(/Electrónica/)).toBeTruthy();
    expect(screen.queryByText(/Categoría: 3\b/)).toBeNull();
  });

  it("muestra autor, fecha de publicación y de actualización", async () => {
    const usuario = userEvent.setup();
    montar({ datos: [completo] });
    await abrir(usuario);

    // Se mira dentro del detalle: el autor también aparece en la fila
    const ficha = within(screen.getByLabelText("Detalle del anuncio"));
    expect(ficha.getByText("Ana P.")).toBeTruthy();
    expect(ficha.getByText("Publicado")).toBeTruthy();
    expect(ficha.getByText("Actualizado")).toBeTruthy();
  });

  it("abre cada imagen por separado y se puede cerrar", async () => {
    const usuario = userEvent.setup();
    montar({ datos: [completo] });
    await abrir(usuario);

    await usuario.click(
      screen.getByRole("button", { name: "Ampliar imagen 1 de 2" }),
    );

    const dialogo = await screen.findByRole("dialog", {
      name: "Imagen ampliada",
    });
    expect(dialogo.querySelector("img").getAttribute("src")).toContain(
      "/media/uno.png",
    );

    await usuario.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(
      screen.queryByRole("dialog", { name: "Imagen ampliada" }),
    ).toBeNull();
  });

  it("pasa a la imagen siguiente sin cerrar", async () => {
    const usuario = userEvent.setup();
    montar({ datos: [completo] });
    await abrir(usuario);

    await usuario.click(
      screen.getByRole("button", { name: "Ampliar imagen 1 de 2" }),
    );
    await usuario.click(
      screen.getByRole("button", { name: "Imagen siguiente" }),
    );

    const dialogo = screen.getByRole("dialog", { name: "Imagen ampliada" });
    expect(dialogo.querySelector("img").getAttribute("src")).toContain(
      "/media/dos.png",
    );
  });
});

describe("navegación entre secciones desde moderación", () => {
  it("el admin llega a usuarios y categorías", async () => {
    montar({ rol: "admin" });

    expect(
      await screen.findByRole("link", { name: "Categorías" }),
    ).toBeTruthy();
    expect(await screen.findByRole("link", { name: "Usuarios" })).toBeTruthy();
  });

  it("el moderador llega a categorías pero no a usuarios", async () => {
    montar({ rol: "moderador" });

    expect(
      await screen.findByRole("link", { name: "Categorías" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Usuarios" })).toBeNull();
  });
});
