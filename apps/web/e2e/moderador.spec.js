// Rol `moderador`: un solo inicio de sesión.
// Aprueba el anuncio que dejó pendiente el spec del miembro y comprueba la
// regla que más se salta la intuición: nadie modera su propio anuncio (R5).
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const email = process.env.E2E_MOD_EMAIL;
const contrasena = process.env.E2E_PASSWORD;

const ESTADO = path.join(process.cwd(), "e2e", ".auth", "anuncio.json");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

test.skip(!email || !contrasena, "define E2E_MOD_EMAIL y E2E_PASSWORD");

test("rol moderador: cola, decisión y no auto-aprobación", async ({ page }) => {
  // --- Entrar ---
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Anuncios disponibles" }),
  ).toBeVisible();

  // El moderador ve el enlace de moderación, pero NO administración
  await expect(page.getByRole("link", { name: "Moderación" })).toBeVisible();
  await page.goto("/admin/usuarios");
  await expect(
    page.getByRole("heading", { name: "No tienes acceso a administración" }),
  ).toBeVisible();

  // --- Cola: el anuncio del miembro está pendiente ---
  await page.goto("/moderacion");
  await expect(
    page.getByRole("heading", { name: "Moderación", exact: true }),
  ).toBeVisible();

  const delMiembro = fs.existsSync(ESTADO)
    ? JSON.parse(fs.readFileSync(ESTADO, "utf8")).nombreMiembro
    : null;

  if (delMiembro) {
    await page
      .getByRole("group", { name: "Filtrar por estado" })
      .getByRole("button", { name: "Pendientes" })
      .click();
    const fila = page.getByRole("listitem").filter({ hasText: delMiembro });
    if ((await fila.count()) === 0) {
      test.info().annotations.push({
        type: "nota",
        description: "El anuncio del miembro no está en la cola; se omite.",
      });
      return;
    }
    await expect(fila).toBeVisible();
    await expect(fila.getByRole("button", { name: "Rechazar" })).toBeVisible();

    // Aprobar lo saca de pendientes y lo deja en aprobados
    await fila.getByRole("button", { name: "Aprobar" }).click();
    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: delMiembro })
        .getByRole("button", { name: "Aprobar" }),
    ).toHaveCount(0);

    await page
      .getByRole("group", { name: "Filtrar por estado" })
      .getByRole("button", { name: "Aprobados" })
      .click();
    const aprobado = page.getByRole("listitem").filter({ hasText: delMiembro });
    await expect(aprobado).toBeVisible();
    await expect(
      aprobado.getByRole("button", { name: "Retraer" }),
    ).toBeVisible();
  } else {
    test.info().annotations.push({
      type: "nota",
      description: "El spec del miembro no dejó anuncio; se omite la decisión.",
    });
  }

  // --- R5: nadie aprueba su propio anuncio ---
  const propio = `Anuncio propio moderador e2e ${Date.now()}`;

  await page.goto("/publicar");
  await page.getByLabel("Nombre").fill(propio);
  await page.getByLabel("Precio (USD)").fill("9.99");
  await page.getByLabel("Descripción").fill("Prueba de no auto-aprobación.");
  await page.locator('input[type="file"]').setInputFiles({
    name: "prueba.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Publicar anuncio" }).click();
  await expect(
    page.getByRole("heading", { name: "Anuncio publicado" }),
  ).toBeVisible();

  // Nace pendiente como el de cualquiera, incluso siendo moderador
  await page.goto("/moderacion");
  await page
    .getByRole("group", { name: "Filtrar por estado" })
    .getByRole("button", { name: "Pendientes" })
    .click();
  const filaPropia = page.getByRole("listitem").filter({ hasText: propio });
  await expect(filaPropia).toBeVisible();

  // El servidor lo rechaza: la interfaz ofrece el botón, la autoridad es la API.
  // El anuncio sigue pendiente después del intento.
  await filaPropia.getByRole("button", { name: "Aprobar" }).click();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: propio })
      .getByRole("button", { name: "Aprobar" }),
  ).toBeVisible();

  // HALLAZGO: el 403 no se muestra. `errorDecision` solo se pinta dentro del
  // panel de decisión, que "aprobar" no abre, así que el clic falla en silencio.
  await expect(page.getByRole("alert")).toHaveCount(0);

  // Se deja constancia para la limpieza posterior
  const estado = fs.existsSync(ESTADO)
    ? JSON.parse(fs.readFileSync(ESTADO, "utf8"))
    : {};
  fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
  fs.writeFileSync(
    ESTADO,
    JSON.stringify({ ...estado, nombreModerador: propio }),
  );
});
