import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "@uni-market/api-client";
import { Publicar } from "../src/pantallas/Publicar.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

function montar({ estadoSesion = "autenticado", crearAnuncio } = {}) {
  const cliente = {
    categorias: {
      listarCategorias: vi.fn().mockResolvedValue({
        datos: [{ id: 3, nombre: "Electrónica", orden: 1 }],
      }),
    },
    anuncios: { crearAnuncio },
  };
  const sesion = {
    ejecutar: (operacion) => operacion(),
    cerrarSesion: vi.fn(),
  };
  const estado = {
    estado: estadoSesion,
    usuario: estadoSesion === "autenticado" ? { nombre: "Ana" } : null,
  };
  return render(
    <MemoryRouter initialEntries={["/publicar"]}>
      <SesionContexto.Provider value={{ cliente, sesion, estado }}>
        <Routes>
          <Route path="/publicar" element={<Publicar />} />
          <Route path="/entrar" element={<h1>Entrar</h1>} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

async function completar(usuario) {
  await usuario.type(screen.getByLabelText("Nombre"), "Calculadora");
  await usuario.type(screen.getByLabelText("Precio (USD)"), "45");
  const archivo = new File(["x"], "foto.png", { type: "image/png" });
  await usuario.upload(screen.getByLabelText("Imágenes"), archivo);
  return archivo;
}

describe("pantalla Publicar", () => {
  it("valida nombre, precio e imágenes antes de llamar a la API", async () => {
    const usuario = userEvent.setup();
    const crearAnuncio = vi.fn();
    montar({ crearAnuncio });

    await usuario.click(
      screen.getByRole("button", { name: "Publicar anuncio" }),
    );

    expect(screen.getByText("Escribe un nombre.")).toBeTruthy();
    expect(screen.getByText("Escribe un precio.")).toBeTruthy();
    expect(screen.getByText("Agrega al menos una imagen.")).toBeTruthy();
    expect(crearAnuncio).not.toHaveBeenCalled();
  });

  it("envía el anuncio y muestra el desenlace de revisión", async () => {
    const usuario = userEvent.setup();
    const crearAnuncio = vi.fn().mockResolvedValue({});
    montar({ crearAnuncio });

    await completar(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "Publicar anuncio" }),
    );

    await waitFor(() => expect(crearAnuncio).toHaveBeenCalled());
    const [nombre, precio, imagenes] = crearAnuncio.mock.calls[0];
    expect(nombre).toBe("Calculadora");
    expect(precio).toBe(45);
    expect(imagenes).toHaveLength(1);
    expect(
      await screen.findByRole("heading", { name: "Anuncio publicado" }),
    ).toBeTruthy();
  });

  it("muestra el 422 del servidor", async () => {
    const usuario = userEvent.setup();
    const crearAnuncio = vi.fn().mockRejectedValue(
      new ApiError("Unprocessable", {
        status: 422,
        problem: { detail: "El precio supera el máximo permitido." },
      }),
    );
    montar({ crearAnuncio });

    await completar(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "Publicar anuncio" }),
    );

    const aviso = await screen.findByRole("alert");
    expect(aviso.textContent).toContain(
      "El precio supera el máximo permitido.",
    );
  });

  it("redirige a entrar sin sesión", async () => {
    montar({ estadoSesion: "anonimo", crearAnuncio: vi.fn() });

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeTruthy();
  });
});
