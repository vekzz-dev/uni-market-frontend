// Rol `miembro`: un solo inicio de sesión y el recorrido completo.
//
// Deja un anuncio `pendiente` para que el spec del moderador lo apruebe; el
// nombre se comparte por archivo. La baja del anuncio se hace en la limpieza
// posterior, fuera de la suite (ver README de e2e).
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const email = process.env.E2E_MIEMBRO_1_EMAIL;
const contrasena = process.env.E2E_PASSWORD;

const ESTADO = path.join(process.cwd(), "e2e", ".auth", "anuncio.json");
const MARCA = `Anuncio e2e ${Date.now()}`;

// PNG 1×1 válido: el servidor valida por magic bytes, no por el nombre.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

test.skip(!email || !contrasena, "define E2E_MIEMBRO_1_EMAIL y E2E_PASSWORD");

test("rol miembro: publicar, panel, edición, perfil y mensajería", async ({
  page,
}) => {
  // Sin estado heredado: si una corrida anterior falló, su anuncio ya no existe
  fs.rmSync(ESTADO, { force: true });

  // --- Entrar ---
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Anuncios disponibles" }),
  ).toBeVisible();

  // El miembro NO ve el enlace de moderación
  await expect(page.getByRole("link", { name: "Moderación" })).toHaveCount(0);

  // --- Publicar ---
  await page.goto("/publicar");
  await expect(
    page.getByRole("heading", { name: "Publicar anuncio" }),
  ).toBeVisible();

  await page.getByLabel("Nombre").fill(MARCA);
  await page.getByLabel("Precio (USD)").fill("15.50");
  await page.getByLabel("Descripción").fill("Artículo de prueba e2e.");
  await page.locator('input[type="file"]').setInputFiles({
    name: "prueba.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Publicar anuncio" }).click();
  await expect(
    page.getByRole("heading", { name: "Anuncio publicado" }),
  ).toBeVisible();

  fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
  fs.writeFileSync(ESTADO, JSON.stringify({ nombreMiembro: MARCA }));

  // --- Panel: aparece como pendiente ---
  await page.goto("/mis-anuncios");
  await expect(
    page.getByRole("heading", { name: "Mis anuncios" }),
  ).toBeVisible();
  const fila = page.getByRole("listitem").filter({ hasText: MARCA });
  await expect(fila).toBeVisible();
  await expect(fila.getByText("Pendiente")).toBeVisible();

  // El filtro por estado responde
  await page
    .getByRole("group", { name: "Filtrar por estado" })
    .getByRole("button", { name: "Aprobados" })
    .click();
  // Recién creado sigue pendiente: no aparece entre los aprobados
  await expect(page.getByText(MARCA)).toHaveCount(0);

  // --- Editar: relee por id y guarda ---
  await page
    .getByRole("group", { name: "Filtrar por estado" })
    .getByRole("button", { name: "Pendientes" })
    .click();
  const filaPendiente = page.getByRole("listitem").filter({ hasText: MARCA });
  await filaPendiente.getByRole("link", { name: "Editar" }).click();

  await expect(
    page.getByRole("heading", { name: "Editar anuncio" }),
  ).toBeVisible();
  const nombre = page.getByLabel("Nombre");
  await expect(nombre).toHaveValue(MARCA);

  const editado = `${MARCA} editado`;
  await nombre.fill(editado);
  await page.getByRole("button", { name: /Guardar/i }).click();
  await expect(page.getByText(/guardad|actualizad/i).first()).toBeVisible();

  // El anuncio sigue pendiente tras editar (la edición reinicia revisión, R6)
  await page.goto("/mis-anuncios");
  await expect(
    page.getByRole("listitem").filter({ hasText: editado }),
  ).toBeVisible();

  // --- Perfil: guarda y restaura el nombre ---
  await page.goto("/perfil");
  const campoNombre = page.getByLabel("Nombre");
  await expect(campoNombre).toBeVisible();
  const original = await campoNombre.inputValue();
  const nuevo = `${original.split(" e2e")[0]} e2e`;

  await campoNombre.fill(nuevo);
  await page.getByRole("button", { name: /Guardar/i }).click();
  await expect(page.getByText(/perfil actualizado/i)).toBeVisible();

  await campoNombre.fill(original);
  await page.getByRole("button", { name: /Guardar/i }).click();
  await expect(campoNombre).toHaveValue(original);

  // --- Mensajería: lista, hilo y envío si hay conversación ---
  await page.goto("/mensajes");
  await expect(page.getByRole("heading", { name: "Mensajes" })).toBeVisible();

  const primera = page.getByRole("link", { name: /Compra|Venta/ }).first();
  if ((await primera.count()) > 0) {
    await primera.click();
    const campo = page.getByRole("textbox", { name: "Mensaje" });
    await expect(campo).toBeVisible();
    const texto = `Mensaje e2e ${Date.now()}`;
    await campo.fill(texto);
    await page.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(page.getByText(texto)).toBeVisible();
  } else {
    test.info().annotations.push({
      type: "nota",
      description: "La cuenta no tiene conversaciones; se omite el hilo.",
    });
  }

  // El anuncio queda pendiente a propósito para el spec del moderador
  fs.writeFileSync(ESTADO, JSON.stringify({ nombreMiembro: editado }));
});
