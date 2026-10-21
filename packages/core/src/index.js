// @uni-market/core — dominio compartido de las dos apps.
// Sin React ni React Native: debe poder ejecutarse en Node para sus pruebas.

export { ESTADOS, crearGestorSesion } from './sesion/gestorSesion.js';
export { mapearProblema } from './errores/mapearProblema.js';
export { formatearPrecio, formatearFecha, formatearFechaRelativa } from './formato/formato.js';
export { resolverUrlMedia } from './medios/resolverUrlMedia.js';
