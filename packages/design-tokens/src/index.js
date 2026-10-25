// @uni-market/design-tokens — punto de entrada.
// Una sola fuente de tokens para las dos apps: web consume build/tokens.css
// (variables CSS) y móvil consume estos objetos dentro de StyleSheet.create.

export * as primitives from "./primitives.js";
export { light, dark } from "./semantic.js";
export { componentsFor } from "./components.js";

import { light, dark } from "./semantic.js";
import { componentsFor } from "./components.js";

/** Temas disponibles. `light` es el predeterminado. */
export const themes = { light, dark };

/**
 * Devuelve el tema completo (roles semánticos + componentes) para un modo dado.
 * @param {'light'|'dark'} mode
 */
export const themeFor = (mode = "light") => {
  const semantic = mode === "dark" ? dark : light;
  return { mode, semantic, components: componentsFor(semantic) };
};

/** Nombres de los temas disponibles, en orden de preferencia. */
export const themeNames = Object.keys(themes);
