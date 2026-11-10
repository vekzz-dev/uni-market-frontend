// Humo e2e completo en un solo recorrido y un solo login.
//
// El login tiene rate limit (5/min por IP y email): repetirlo por prueba hacía
// fallar la suite. Un único inicio de sesión cubre catálogo, panel, mensajería
// y perfil.
//
// Requiere la API arriba y una cuenta confirmada, con al menos una conversación
// para el tramo de mensajería:
//   E2E_EMAIL=ana@uni.edu E2E_PASSWORD=secreta123 pnpm e2e
import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const contrasena = process.env.E2E_PASSWORD;

test.skip(!email || !contrasena, "define E2E_EMAIL y E2E_PASSWORD");
test.describe.configure({ mode: "serial" });

test("recorrido completo: catálogo, panel, mensajes y perfil", async ({
  page,
}) => {
  // Entrar
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Anuncios disponibles" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Cuenta" })).toBeVisible();

  // Panel del vendedor
  await page.getByRole("link", { name: "Mis anuncios" }).click();
  await expect(
    page.getByRole("heading", { name: "Mis anuncios" }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Filtrar por estado" }),
  ).toBeVisible();
  // La cuenta puede no tener anuncios: si los tiene, la fila trae "Editar".
  const editar = page.getByRole("link", { name: "Editar" });
  if ((await editar.count()) > 0) {
    await expect(editar.first()).toBeVisible();
  }

  // Mensajería: lista, hilo y envío
  await page.goto("/mensajes");
  await expect(page.getByRole("heading", { name: "Mensajes" })).toBeVisible();
  const primera = page.getByRole("link", { name: /Compra|Venta/ }).first();
  await expect(primera).toBeVisible();
  await primera.click();
  const campo = page.getByRole("textbox", { name: "Mensaje" });
  await expect(campo).toBeVisible();
  const texto = `Mensaje e2e ${Date.now()}`;
  await campo.fill(texto);
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByText(texto)).toBeVisible();

  // Perfil: cambia el nombre, confirma y lo restaura
  await page.goto("/perfil");
  const nombre = page.getByLabel("Nombre");
  await expect(nombre).toBeVisible();
  const original = await nombre.inputValue();
  const nuevo = `${original.split(" e2e")[0]} e2e`;
  await nombre.fill(nuevo);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Perfil actualizado.")).toBeVisible();
  await expect(nombre).toHaveValue(nuevo);

  await nombre.fill(original);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(nombre).toHaveValue(original);
});
