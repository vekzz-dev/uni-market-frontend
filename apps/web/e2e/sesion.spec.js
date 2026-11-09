// Humo e2e: navegador real contra la web y la API local.
//
// Requiere la API arriba y una cuenta confirmada. Se omite si no defines
// E2E_EMAIL y E2E_PASSWORD:
//
//   E2E_EMAIL=ana@uni.edu E2E_PASSWORD=secreta123 pnpm e2e
import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const contrasena = process.env.E2E_PASSWORD;

test.skip(
  !email || !contrasena,
  "define E2E_EMAIL y E2E_PASSWORD con una cuenta confirmada",
);

test("un miembro entra y ve el catálogo", async ({ page }) => {
  await page.goto("/entrar");

  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(
    page.getByRole("heading", { name: "Anuncios disponibles" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Cuenta" })).toBeVisible();
});

test("el panel del vendedor carga con la sesión", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.getByRole("link", { name: "Mis anuncios" }).first().click();

  await expect(
    page.getByRole("heading", { name: "Mis anuncios" }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Filtrar por estado" }),
  ).toBeVisible();
});
