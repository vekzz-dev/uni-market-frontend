import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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
    await usuario.click(screen.getByRole("button", { name: "Enviar enlace" }));

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
    await usuario.click(screen.getByRole("button", { name: "Enviar enlace" }));

    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Enviar enlace" }).disabled).toBe(
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
    await usuario.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(
      await screen.findByRole("heading", { name: "Revisa tu correo" }),
    ).toBeTruthy();
  });
});

describe("pantalla Nueva contraseña", () => {
  it("exige que las contraseñas coincidan antes de llamar a la API", async () => {
    const usuario = userEvent.setup();
    const confirmarRestablecimiento = vi.fn();
    montar(<NuevaContrasena />, "/nueva-contrasena?token=abc", {
      confirmarRestablecimiento,
    });

    await usuario.type(
      screen.getByLabelText("Nueva contraseña", { selector: "input" }),
      "secreta123",
    );
    await usuario.type(
      screen.getByLabelText("Repetir contraseña", { selector: "input" }),
      "secreta124",
    );
    await usuario.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeTruthy();
    expect(confirmarRestablecimiento).not.toHaveBeenCalled();
  });

  it("muestra el enlace inválido cuando el token ya no sirve", async () => {
    const usuario = userEvent.setup();
    const confirmarRestablecimiento = vi
      .fn()
      .mockRejectedValue(new ApiError("Token inválido", { status: 422 }));
    montar(<NuevaContrasena />, "/nueva-contrasena?token=abc", {
      confirmarRestablecimiento,
    });

    await usuario.type(
      screen.getByLabelText("Nueva contraseña", { selector: "input" }),
      "secreta123",
    );
    await usuario.type(
      screen.getByLabelText("Repetir contraseña", { selector: "input" }),
      "secreta123",
    );
    await usuario.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(
      await screen.findByRole("heading", { name: "El enlace no es válido" }),
    ).toBeTruthy();
  });

  it("guarda la contraseña nueva y ofrece entrar", async () => {
    const usuario = userEvent.setup();
    const confirmarRestablecimiento = vi.fn().mockResolvedValue({});
    montar(<NuevaContrasena />, "/nueva-contrasena?token=abc", {
      confirmarRestablecimiento,
    });

    await usuario.type(
      screen.getByLabelText("Nueva contraseña", { selector: "input" }),
      "secreta123",
    );
    await usuario.type(
      screen.getByLabelText("Repetir contraseña", { selector: "input" }),
      "secreta123",
    );
    await usuario.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );

    expect(confirmarRestablecimiento).toHaveBeenCalledWith({
      token: "abc",
      nuevaContrasena: "secreta123",
    });
    expect(
      await screen.findByRole("heading", { name: "Contraseña actualizada" }),
    ).toBeTruthy();
  });
});
