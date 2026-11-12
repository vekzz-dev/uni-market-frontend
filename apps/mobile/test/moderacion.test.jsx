import { act, fireEvent, render } from "@testing-library/react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Moderacion } from "../src/pantallas/Moderacion.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

jest.setTimeout(20000);

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

const pendiente = {
  id: "a1",
  nombre: "Calculadora Casio",
  precio: 45,
  vendedorNombre: "Ana P.",
  fechaCreacion: "2026-11-01T10:00:00Z",
  estadoRevision: "pendiente",
  imagenUrls: [],
};

async function montar({
  datos = [pendiente],
  rol = "moderador",
  decidirRevision = jest.fn().mockResolvedValue({}),
} = {}) {
  const moderacion = {
    listarColaModeracion: jest.fn().mockResolvedValue({
      datos,
      paginacion: {
        pagina: 0,
        limite: 10,
        total: datos.length,
        totalPaginas: 1,
      },
    }),
    decidirRevision,
  };
  const cliente = { moderacion };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: jest.fn(),
  };
  const estado = {
    estado: "autenticado",
    usuario: { id: "u9", nombre: "Mod", rol },
  };

  const vista = await render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <SesionContexto.Provider
        value={{ cliente, sesion, estado, restaurado: true }}
      >
        <Moderacion />
      </SesionContexto.Provider>
    </TemaContexto.Provider>,
  );

  return { vista, moderacion };
}

describe("pantalla Moderación (móvil)", () => {
  it("lista la cola pendiente", async () => {
    const { vista, moderacion } = await montar();

    expect(await vista.findByText("Calculadora Casio")).toBeTruthy();
    expect(vista.getByText(/Vendedor: Ana P\./)).toBeTruthy();
    expect(moderacion.listarColaModeracion).toHaveBeenCalledWith({
      estadoRevision: "pendiente",
      pagina: 0,
      limite: 10,
    });
  });

  it("no rechaza sin motivo", async () => {
    const { vista, moderacion } = await montar();

    await vista.findByText("Calculadora Casio");
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Rechazar" }));
    });
    await act(async () => {
      fireEvent.press(
        vista.getByRole("button", { name: "Confirmar rechazar" }),
      );
    });

    expect(vista.getByText("Explica el motivo de la decisión.")).toBeTruthy();
    expect(moderacion.decidirRevision).not.toHaveBeenCalled();
  });

  it("aprueba un anuncio", async () => {
    const { vista, moderacion } = await montar();

    await vista.findByText("Calculadora Casio");
    await act(async () => {
      fireEvent.press(vista.getByRole("button", { name: "Aprobar" }));
    });

    expect(moderacion.decidirRevision).toHaveBeenCalledWith("a1", {
      decision: "aprobar",
    });
    expect(await vista.findByText("Anuncio aprobado.")).toBeTruthy();
  });
});

describe("detalle del anuncio en la cola (móvil)", () => {
  it("abre la descripción antes de decidir", async () => {
    const conDetalle = {
      ...pendiente,
      descripcion: "Calculadora en buen estado, incluye estuche.",
      imagenUrls: ["/media/uno.png"],
    };
    const { vista } = await montar({ datos: [conDetalle] });

    await vista.findByText("Calculadora Casio");
    expect(vista.queryByText(/incluye estuche/)).toBeNull();

    await fireEvent.press(vista.getByRole("button", { name: "Ver detalle" }));

    await vista.findByText(/incluye estuche/);
    await fireEvent.press(
      vista.getByRole("button", { name: "Ocultar detalle" }),
    );
    expect(vista.queryByText(/incluye estuche/)).toBeNull();
  });
});
