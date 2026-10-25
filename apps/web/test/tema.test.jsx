import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectorTema } from "../src/componentes/SelectorTema.jsx";
import {
  aplicarTema,
  guardarTema,
  leerTema,
  siguienteTema,
} from "../src/tema.js";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.umTheme;
});

describe("tema", () => {
  it("arranca en sistema y cicla sistema → claro → oscuro", () => {
    expect(leerTema()).toBe("sistema");
    expect(siguienteTema("sistema")).toBe("claro");
    expect(siguienteTema("claro")).toBe("oscuro");
    expect(siguienteTema("oscuro")).toBe("sistema");
  });

  it("aplica el atributo de tokens y lo limpia en sistema", () => {
    aplicarTema("oscuro");
    expect(document.documentElement.dataset.umTheme).toBe("dark");
    aplicarTema("claro");
    expect(document.documentElement.dataset.umTheme).toBe("light");
    aplicarTema("sistema");
    expect(document.documentElement.dataset.umTheme).toBeUndefined();
  });

  it("persiste la elección", () => {
    guardarTema("oscuro");
    expect(leerTema()).toBe("oscuro");
  });
});

describe("SelectorTema", () => {
  it("cambia el tema y lo anuncia al lector de pantalla", async () => {
    const usuario = userEvent.setup();
    render(<SelectorTema />);

    const boton = screen.getByRole("button", { name: /Tema del sistema/ });
    await usuario.click(boton);

    expect(document.documentElement.dataset.umTheme).toBe("light");
    expect(localStorage.getItem("umi.tema")).toBe("claro");
    expect(screen.getByRole("button", { name: /Tema claro/ })).toBeTruthy();
  });
});
