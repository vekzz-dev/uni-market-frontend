// Capacidades por rol (PRD §3). Sirven para OCULTAR o DESHABILITAR en la interfaz.
// La autorización real la hace el servidor y se relee en cada request (R3):
// una vista nunca decide permisos, y un 403 es un caso de negocio normal.

const NIVEL = Object.freeze({ miembro: 1, moderador: 2, admin: 3 });

/** Capacidad → rol mínimo. */
export const CAPACIDADES = Object.freeze({
  'anuncios.publicar': 'miembro',
  'anuncios.gestionar': 'miembro',
  'conversaciones.usar': 'miembro',
  'perfil.gestionar': 'miembro',
  'moderacion.decidir': 'moderador',
  'categorias.gestionar': 'moderador',
  'admin.usuarios': 'admin',
  'admin.roles': 'admin',
});

export const ROLES = Object.freeze(Object.keys(NIVEL));

export const esRolValido = (rol) => Object.prototype.hasOwnProperty.call(NIVEL, rol);

/**
 * @param {string|null|undefined} rol  rol del usuario según el servidor
 * @param {string} capacidad  clave de CAPACIDADES
 */
export function puede(rol, capacidad) {
  const minimo = CAPACIDADES[capacidad];
  if (!minimo) return false;
  return (NIVEL[rol] ?? 0) >= NIVEL[minimo];
}
