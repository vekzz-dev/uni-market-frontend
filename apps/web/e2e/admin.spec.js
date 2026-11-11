// Rol `admin`: un solo inicio de sesión.
// Conservador con lo destructivo: no cambia roles ni inhabilita cuentas reales.
// El 403 de cambiar el propio rol (R14) se verifica contra la API en
// `docs/testing-strategy.md`; aquí se cubre listado, búsqueda, filtro y el CRUD
// de categorías con una categoría de prueba que se crea y se borra.
import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const contrasena = process.env.E2E_PASSWORD;

test.skip(!email || !contrasena, "define E2E_ADMIN_EMAIL y E2E_PASSWORD");

test("rol admin: capacidades, usuarios y categorías", async ({ page }) => {
  // --- Entrar ---
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Anuncios disponibles" }),
  ).toBeVisible();

  // `anuncios.gestionar` es una capacidad de miembro: el admin la hereda y
  // gestiona SUS anuncios como cualquiera. Editar los ajenos no existe (R7).
  await expect(page.getByRole("link", { name: "Mis anuncios" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Publicar anuncio" }),
  ).toBeVisible();

  // La cabecera da acceso a todas las secciones del rol (antes solo Moderación)
  await expect(page.getByRole("link", { name: "Moderación" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Categorías" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Usuarios" })).toBeVisible();

  // --- Usuarios: se llega desde el catálogo, sin escribir la URL ---
  await page.getByRole("link", { name: "Usuarios" }).click();
  await expect(
    page.getByRole("heading", { name: "Usuarios", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("listitem").first()).toBeVisible();

  const buscador = page.getByRole("searchbox", { name: "Buscar usuarios" });
  await buscador.fill(email);
  await buscador.press("Enter");
  await expect(page.getByText(email).first()).toBeVisible();

  // Se limpia la búsqueda antes de filtrar: ambas se combinan
  await page.getByRole("button", { name: "Limpiar" }).click();
  await page
    .getByRole("group", { name: "Filtrar por rol" })
    .getByRole("button", { name: "Moderadores" })
    .click();

  const textos = await page
    .getByRole("listitem")
    .evaluateAll((filas) =>
      filas.map((f) => (f.textContent ?? "").toLowerCase()),
    );
  for (const texto of textos) expect(texto).toContain("moderador");

  // --- Categorías: alta, edición y baja de una categoría de prueba ---
  const nombre = `Categoría e2e ${Date.now()}`;
  const renombrada = `${nombre} editada`;

  await page.goto("/admin/categorias");
  await expect(
    page.getByRole("heading", { name: "Categorías", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Nueva categoría" }).click();
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Icono").fill("box");
  await page.getByLabel("Descripción").fill("Categoría de prueba e2e.");
  await page.getByRole("button", { name: "Guardar categoría" }).click();
  await expect(page.getByText("Categoría creada.")).toBeVisible();
  await expect(page.getByText(nombre)).toBeVisible();

  const fila = page.getByRole("listitem").filter({ hasText: nombre });
  await fila.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Nombre").fill(renombrada);
  await page.getByRole("button", { name: "Guardar categoría" }).click();
  await expect(page.getByText("Categoría actualizada.")).toBeVisible();
  await expect(page.getByText(renombrada)).toBeVisible();

  // La baja pide confirmación en un diálogo nativo
  page.on("dialog", (dialogo) => dialogo.accept());
  const filaFinal = page.getByRole("listitem").filter({ hasText: renombrada });
  await filaFinal.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Categoría eliminada.")).toBeVisible();
  await expect(page.getByText(renombrada)).toHaveCount(0);
});
