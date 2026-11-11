import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";
import { ApiError } from "@uni-market/api-client";
import { Confirmar } from "../src/pantallas/Confirmar.jsx";
import { SesionContexto } from "../src/sesion/SesionContexto.jsx";

const CODIGO_INVALIDO = "El código es inválido, expiró o ya fue usado.";

function montar(confirmarEmail, entrada = "/confirmar-email") {
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

async function rellenar(
  usuario,
  { email = "ana@uni.edu", pin = "123456" } = {},
) {
  await usuario.type(screen.getByLabelText("Correo"), email);
  await usuario.type(screen.getByLabelText("Código"), pin);
}

describe("pantalla Confirmar", () => {
  it("envía email y PIN y confirma la cuenta", async () => {
    const usuario = userEvent.setup();
    const confirmarEmail = vi.fn().mockResolvedValue({});
    montar(confirmarEmail);

    await rellenar(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "Confirmar cuenta" }),
    );

    expect(confirmarEmail).toHaveBeenCalledWith({
      email: "ana@uni.edu",
      pin: "123456",
    });
    expect(
      await screen.findByRole("heading", { name: "Cuenta confirmada" }),
    ).toBeTruthy();
  });

  it("no llama a la API con un PIN que no tiene 6 dígitos", async () => {
    const usuario = userEvent.setup();
    const confirmarEmail = vi.fn();
    montar(confirmarEmail);

    await rellenar(usuario, { pin: "12345" });
    await usuario.click(
      screen.getByRole("button", { name: "Confirmar cuenta" }),
    );

    expect(
      screen.getByText("El código debe tener exactamente 6 dígitos."),
    ).toBeTruthy();
    expect(confirmarEmail).not.toHaveBeenCalled();
  });

  it("muestra el mensaje genérico del servidor cuando el código no sirve", async () => {
    const usuario = userEvent.setup();
    const confirmarEmail = vi.fn().mockRejectedValue(
      new ApiError(CODIGO_INVALIDO, {
        status: 422,
        problem: { detail: CODIGO_INVALIDO },
      }),
    );
    montar(confirmarEmail);

    await rellenar(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "Confirmar cuenta" }),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      CODIGO_INVALIDO,
    );
    // Sigue en el formulario: quedan intentos y no se revela la causa.
    expect(screen.getByLabelText("Código")).toBeTruthy();
  });

  it("informa del límite de intentos en un 429", async () => {
    const usuario = userEvent.setup();
    const confirmarEmail = vi
      .fn()
      .mockRejectedValue(new ApiError("Demasiados intentos", { status: 429 }));
    montar(confirmarEmail);

    await rellenar(usuario);
    await usuario.click(
      screen.getByRole("button", { name: "Confirmar cuenta" }),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Demasiados intentos seguidos",
    );
  });

  it("precarga el correo que llega desde el registro", async () => {
    montar(vi.fn(), {
      pathname: "/confirmar-email",
      state: { email: "ana@uni.edu" },
    });

    const correo = await screen.findByLabelText("Correo");
    expect(correo.value).toBe("ana@uni.edu");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    montar(vi.fn());

    expect((await axe(document.body)).violations).toEqual([]);
  });
});
