import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    setupFiles: "./test/setup.js",
    css: true,
    // e2e es de Playwright: vitest no debe recoger sus specs.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
