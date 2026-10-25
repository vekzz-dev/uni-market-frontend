import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "@uni-market/api-client";
import { Confirmar } from "../src/pantallas/Confirmar.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

function montar(confirmarEmail, entrada = "/confirmar-email?token=abc") {
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <SesionContexto.Provider
        value={{
          cliente: { auth: { confirmarEmail } },
          sesion: {},
          estado: { estado: "anonimo", usuario: null },
        }}
      >
        <Confirmar />
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

describe("pantalla Confirmar", () => {
  it("consume el token una sola vez y confirma la cuenta", async () => {
    const confirmarEmail = vi.fn().mockResolvedValue({});
    montar(confirmarEmail);

    expect(
      await screen.findByRole("heading", { name: "Cuenta confirmada" }),
    ).toBeTruthy();
    expect(confirmarEmail).toHaveBeenCalledTimes(1);
    expect(confirmarEmail).toHaveBeenCalledWith("abc");
  });

  it("muestra el enlace inválido cuando el token ya no sirve", async () => {
    const confirmarEmail = vi
      .fn()
      .mockRejectedValue(new ApiError("Token inválido", { status: 410 }));
    montar(confirmarEmail);

    expect(
      await screen.findByRole("heading", { name: "El enlace no es válido" }),
    ).toBeTruthy();
  });

  it("no llama a la API si falta el token", () => {
    const confirmarEmail = vi.fn();
    montar(confirmarEmail, "/confirmar-email");

    expect(
      screen.getByRole("heading", { name: "El enlace no es válido" }),
    ).toBeTruthy();
    expect(confirmarEmail).not.toHaveBeenCalled();
  });
});
