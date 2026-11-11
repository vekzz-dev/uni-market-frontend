// Flujos públicos: no requieren sesión ni tocan datos de nadie.
import { expect, test } from "@playwright/test";

test.describe("anónimo", () => {
  test("catálogo, búsqueda, detalle y 404", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Anuncios disponibles" }),
    ).toBeVisible();

    // Buscador: cualquier texto devuelve una vista consistente
    await page.getByLabel("Buscar en el catálogo").fill("zzzznoexiste");
    await page.getByRole("button", { name: /buscar/i }).click();
    await expect(page.getByText("No encontramos anuncios")).toBeVisible();

    // Se limpia volviendo al catálogo
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Anuncios disponibles" }),
    ).toBeVisible();

    // Detalle: la primera tarjeta abre su anuncio
    const primera = page.locator('a[href^="/anuncios/"]').first();
    await expect(primera).toBeVisible();
    await primera.click();
    await expect(page).toHaveURL(/\/anuncios\/.+/);
    await expect(page.getByRole("heading").first()).toBeVisible();

    // Sin sesión no se puede contactar
    await expect(
      page.getByText("Inicia sesión para contactar al vendedor."),
    ).toBeVisible();

    // 404
    await page.goto("/esta-ruta-no-existe");
    await expect(
      page.getByRole("heading", { name: "Página no encontrada" }),
    ).toBeVisible();
  });

  test("el tema alterna y persiste", async ({ page }) => {
    await page.goto("/");
    const antes = await page.locator("html").getAttribute("data-um-theme");

    await page.getByRole("button", { name: /Cambiar a/i }).click();
    const despues = await page.locator("html").getAttribute("data-um-theme");
    expect(despues).not.toBe(antes);

    // Persiste tras recargar
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-um-theme",
      despues,
    );
  });

  test("el login fallido es genérico y no revela si la cuenta existe", async ({
    page,
  }) => {
    await page.goto("/entrar");
    await page.getByLabel("Correo").fill("nadie@unimarket.com");
    await page.getByLabel("Contraseña").fill("contraseñaIncorrecta");
    await page.getByRole("button", { name: "Entrar" }).click();

    // R13: la respuesta no distingue cuenta inexistente de contraseña mala
    const aviso = page.getByRole("alert");
    await expect(aviso).toBeVisible();
    await expect(aviso).not.toContainText(
      /no existe|no registrad|no encontrad/i,
    );
  });
});
