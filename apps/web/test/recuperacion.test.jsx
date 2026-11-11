import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";
import { ApiError } from "@uni-market/api-client";
import { Restablecer } from "../src/pantallas/Restablecer.jsx";
import { Reenviar } from "../src/pantallas/Reenviar.jsx";
import { NuevaContrasena } from "../src/pantallas/NuevaContrasena.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

function montar(componente, entrada, auth) {
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <SesionContexto.Provider
        value={{
          cliente: { auth },
          sesion: {},
          estado: { estado: "anonimo", usuario: null },
        }}
      >
        {componente}
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

describe("pantalla Restablecer", () => {
  it("no revela si la cuenta existe y confirma el envío", async () => {
    const usuario = userEvent.setup();
    const solicitarRestablecimiento = vi.fn().mockResolvedValue({});
    montar(<Restablecer />, "/restablecer", { solicitarRestablecimiento });

    await usuario.type(screen.getByLabelText("Correo"), "ana@uni.edu");
    await usuario.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(solicitarRestablecimiento).toHaveBeenCalledWith({
      email: "ana@uni.edu",
    });
    expect(
      await screen.findByRole("heading", { name: "Revisa tu correo" }),
    ).toBeTruthy();
  });

  it("deshabilita el envío tras un 429", async () => {
    const usuario = userEvent.setup();
    const solicitarRestablecimiento = vi
      .fn()
      .mockRejectedValue(new ApiError("Demasiados intentos", { status: 429 }));
    montar(<Restablecer />, "/restablecer", { solicitarRestablecimiento });

    await usuario.type(screen.getByLabelText("Correo"), "ana@uni.edu");
    await usuario.click(screen.getByRole("button", { name: "Enviar código" }));

    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Enviar código" }).disabled).toBe(
      true,
    );
  });
});

describe("pantalla Reenviar", () => {
  it("confirma el reenvío sin revelar la cuenta", async () => {
    const usuario = userEvent.setup();
    const reenviarConfirmacion = vi.fn().mockResolvedValue({});
    montar(<Reenviar />, "/reenviar", { reenviarConfirmacion });

    await usuario.type(screen.getByLabelText("Correo"), "ana@uni.edu");
    await usuario.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(
      await screen.findByRole("heading", { name: "Revisa tu correo" }),
    ).toBeTruthy();
  });
});

describe("pantalla Nueva contraseña", () => {
  async function rellenar(
    usuario,
    { pin = "123456", nueva = "secreta123", repetir } = {},
  ) {
    await usuario.type(screen.getByLabelText("Correo"), "ana@uni.edu");
    await usuario.type(screen.getByLabelText("Código"), pin);
    await usuario.type(
      screen.getByLabelText("Nueva contraseña", { selector: "input" }),
      nueva,
    );
    await usuario.type(
      screen.getByLabelText("Repetir contraseña", { selector: "input" }),
      repetir ?? nueva,
    );
  }

  it("exige que las contraseñas coincidan antes de llamar a la API", async () => {
    const usuario = userEvent.setup();
    const confirmarRestablecimiento = vi.fn();
    montar(<NuevaContrasena />, "/nueva-contrasena", {
      confirmarRestablecimiento,
    });

    await rellenar(usuario, { repetir: "secreta124" });
    await usuario.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeTruthy();
    expect(confirmarRestablecimiento).not.toHaveBeenCalled();
  });

  it("exige un PIN de 6 dígitos antes de llamar a la API", async () => {
    const usuario = userEvent.setup();
    const confirmarRestablecimiento = vi.fn();
    montar(<NuevaContrasena />, "/nueva-contrasena", {
      confirmarRestablecimiento,
    });

    await rellenar(usuario, { pin: "1234" });
    await usuario.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(
      screen.getByText("El código debe tener exactamente 6 dígitos."),
    ).toBeTruthy();
    expect(confirmarRestablecimiento).not.toHaveBeenCalled();
  });

  it("muestra el mensaje genérico cuando el PIN no sirve", async () => {
    const usuario = userEvent.setup();
    const detalle = "El código es inválido, expiró o ya fue usado.";
    const confirmarRestablecimiento = vi
      .fn()
      .mockRejectedValue(
        new ApiError(detalle, { status: 422, problem: { detail: detalle } }),
      );
    montar(<NuevaContrasena />, "/nueva-contrasena", {
      confirmarRestablecimiento,
    });

    await rellenar(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(detalle);
    expect(screen.getByLabelText("Código")).toBeTruthy();
  });

  it("guarda la contraseña nueva y ofrece entrar", async () => {
    const usuario = userEvent.setup();
    const confirmarRestablecimiento = vi.fn().mockResolvedValue({});
    montar(<NuevaContrasena />, "/nueva-contrasena", {
      confirmarRestablecimiento,
    });

    await rellenar(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(confirmarRestablecimiento).toHaveBeenCalledWith({
      email: "ana@uni.edu",
      pin: "123456",
      nuevaContrasena: "secreta123",
    });
    expect(
      await screen.findByRole("heading", { name: "Contraseña actualizada" }),
    ).toBeTruthy();
  });
});

describe("accesibilidad de la recuperación", () => {
  it("Restablecer no tiene violaciones", async () => {
    montar(<Restablecer />, "/restablecer", {
      solicitarRestablecimiento: vi.fn().mockResolvedValue({}),
    });

    expect((await axe(document.body)).violations).toEqual([]);
  });

  it("Reenviar no tiene violaciones", async () => {
    montar(<Reenviar />, "/reenviar", {
      reenviarConfirmacion: vi.fn().mockResolvedValue({}),
    });

    expect((await axe(document.body)).violations).toEqual([]);
  });

  it("Nueva contraseña no tiene violaciones", async () => {
    montar(<NuevaContrasena />, "/nueva-contrasena", {
      confirmarRestablecimiento: vi.fn(),
    });

    expect((await axe(document.body)).violations).toEqual([]);
  });
});
