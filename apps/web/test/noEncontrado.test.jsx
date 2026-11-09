import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "vitest-axe";
import { NoEncontrado } from "../src/pantallas/NoEncontrado.jsx";

describe("pantalla NoEncontrado", () => {
  it("explica el 404 y ofrece volver al catálogo", () => {
    render(
      <MemoryRouter initialEntries={["/ruta-inexistente"]}>
        <Routes>
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Página no encontrada" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ir al catálogo" }).getAttribute("href"),
    ).toBe("/");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    render(
      <MemoryRouter initialEntries={["/ruta-inexistente"]}>
        <Routes>
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </MemoryRouter>,
    );

    expect((await axe(document.body)).violations).toEqual([]);
  });
});
