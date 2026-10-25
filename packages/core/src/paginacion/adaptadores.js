// Adaptadores de paginación (docs/api-integration.md §4).
// El catálogo y el historial usan cursor; los paneles usan offset.
// Ninguna pantalla implementa su propio bucle: estas funciones son la única fuente.

/** Cursor opaco: se devuelve tal cual, nunca se interpreta ni se construye. */
export function siguienteCursor(paginacion) {
  return paginacion?.cursorSiguiente ?? null;
}

/**
 * Fusiona páginas sin duplicados, por `id`.
 * El historial de mensajes carga hacia atrás: `alPrincipio` inserta lo nuevo delante.
 */
export function fusionarPagina(
  vigentes = [],
  nuevos = [],
  { alPrincipio = false } = {},
) {
  const combinados = alPrincipio
    ? [...nuevos, ...vigentes]
    : [...vigentes, ...nuevos];
  const vistos = new Set();
  const salida = [];

  for (const item of combinados) {
    const id = item?.id;
    if (id === undefined || id === null) {
      salida.push(item);
      continue;
    }
    if (vistos.has(id)) continue;
    vistos.add(id);
    salida.push(item);
  }

  return salida;
}

/** Estado de navegación para listas con offset. `totalPaginas = 0` es lista vacía, no error. */
export function estadoOffset({ pagina = 0, totalPaginas = 0 } = {}) {
  return {
    hayAnterior: pagina > 0,
    haySiguiente: pagina + 1 < totalPaginas,
  };
}
