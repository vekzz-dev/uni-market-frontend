// @uni-market/core — dominio compartido de las dos apps.
// Sin React ni React Native: debe poder ejecutarse en Node para sus pruebas.

export { ESTADOS, crearGestorSesion } from './sesion/gestorSesion.js';
export { mapearProblema } from './errores/mapearProblema.js';
export { formatearPrecio, formatearFecha, formatearFechaRelativa } from './formato/formato.js';
export { resolverUrlMedia } from './medios/resolverUrlMedia.js';
export { siguienteCursor, fusionarPagina, estadoOffset } from './paginacion/adaptadores.js';
export {
  validarRegistro,
  validarPrecio,
  validarImagenes,
  validarAvatar,
  validarMensaje,
  validarMotivo,
} from './validacion/validar.js';
export { CAPACIDADES, ROLES, esRolValido, puede } from './capacidades/capacidades.js';
