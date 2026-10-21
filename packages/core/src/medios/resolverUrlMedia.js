// Resolver de URLs de medios (docs/api-integration.md §5).
// En dev la API devuelve rutas relativas (/media/...); en prod, URLs absolutas de R2.
// La interfaz nunca construye rutas a mano: guarda el valor y lo resuelve al renderizar.

/**
 * @param {string} valor  URL o ruta que devolvió la API
 * @param {string} origenApi  Base de la API sin `/v1`, p. ej. http://localhost:8080
 * @returns {string|null}
 */
export function resolverUrlMedia(valor, origenApi) {
  if (!valor) return null;

  if (/^https?:\/\//i.test(valor)) return valor;

  const base = String(origenApi ?? '').replace(/\/+$/, '');
  if (!base) return valor;

  return valor.startsWith('/') ? `${base}${valor}` : `${base}/${valor}`;
}
