// Configuración del humo extremo a extremo (opt-in): navegador real contra la
// web y la API local. No es obligatorio en cada commit.
//
// Cada spec hace UN solo inicio de sesión y recorre todos los flujos de su rol:
// el login tiene rate limit (5/min por IP y email) y el token de refresco rota
// al restaurarse, así que compartir sesión entre pruebas la invalida.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
