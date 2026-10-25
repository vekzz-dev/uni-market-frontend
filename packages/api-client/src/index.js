// @uni-market/api-client — punto de entrada.
// Toda llamada HTTP de las apps pasa por aquí: el cliente es generado desde el
// contrato y el transporte es propio (fetch), nunca escrito a mano por dominio.

import ApiClient from "./generado/ApiClient.js";
import AdministracionApi from "./generado/api/AdministracionApi.js";
import AnunciosApi from "./generado/api/AnunciosApi.js";
import AuthApi from "./generado/api/AuthApi.js";
import CatalogoApi from "./generado/api/CatalogoApi.js";
import CategoriasApi from "./generado/api/CategoriasApi.js";
import ConversacionesApi from "./generado/api/ConversacionesApi.js";
import MensajesApi from "./generado/api/MensajesApi.js";
import ModeracionApi from "./generado/api/ModeracionApi.js";
import UsuariosApi from "./generado/api/UsuariosApi.js";

export { ApiError, normalizarProblema } from "./problemas.js";
export { ApiClient };

/**
 * Crea un cliente configurado con todas las APIs del contrato.
 *
 * @param {Object} opciones
 * @param {string} opciones.baseUrl  Base absoluta, p. ej. http://localhost:8080/v1
 * @param {() => string | null} [opciones.getAccessToken]  Token en memoria (no persistido)
 * @param {typeof fetch} [opciones.fetchImpl]  Inyectable para pruebas o para RN
 * @param {number} [opciones.timeout]
 */
export function crearCliente({
  baseUrl,
  getAccessToken,
  fetchImpl,
  timeout,
} = {}) {
  if (!baseUrl) throw new Error("crearCliente necesita baseUrl");

  const api = new ApiClient(baseUrl);
  if (fetchImpl) api.fetchImpl = fetchImpl;
  if (getAccessToken) api.getAccessToken = getAccessToken;
  if (timeout) api.timeout = timeout;

  return {
    api,
    auth: new AuthApi(api),
    usuarios: new UsuariosApi(api),
    catalogo: new CatalogoApi(api),
    anuncios: new AnunciosApi(api),
    categorias: new CategoriasApi(api),
    conversaciones: new ConversacionesApi(api),
    mensajes: new MensajesApi(api),
    moderacion: new ModeracionApi(api),
    administracion: new AdministracionApi(api),
  };
}
