// Traducción de errores de la API a copy de interfaz (docs/api-integration.md §3.2).
//
// El contrato no expone un código de máquina: se clasifica por estado HTTP.
// El `detail` solo se muestra cuando describe una regla de negocio (422);
// nunca se interpreta ni se inyecta como HTML.

import { ApiError, normalizarProblema } from "@uni-market/api-client";

const GENERICO = "Algo falló de nuestro lado. Vuelve a intentarlo.";

/**
 * @param {ApiError|Object|null} entrada  ApiError del cliente o un problema ya normalizado
 * @returns {{status:number, mensaje:string, detalle:string|null, requestId:string|null}}
 */
export function mapearProblema(entrada) {
  const problema =
    entrada instanceof ApiError ? normalizarProblema(entrada) : (entrada ?? {});
  const status = Number(problema.status ?? 0);
  const requestId = problema.requestId ?? null;

  if (status === 0) {
    return {
      status,
      mensaje: "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.",
      detalle: null,
      requestId,
    };
  }

  if (status === 400) {
    return {
      status,
      mensaje: "Revisa los datos del formulario.",
      detalle: null,
      requestId,
    };
  }

  if (status === 401) {
    // Indistinguible a propósito: sesión ausente, expirada, cuenta inhabilitada o baja.
    return {
      status,
      mensaje: "Tu sesión terminó. Inicia sesión de nuevo.",
      detalle: null,
      requestId,
    };
  }

  if (status === 403) {
    return {
      status,
      mensaje: "No tienes permiso para esta acción.",
      detalle: null,
      requestId,
    };
  }

  if (status === 404) {
    // Mismo mensaje para inexistente e invisible (R4).
    return {
      status,
      mensaje: "Este anuncio ya no está disponible.",
      detalle: null,
      requestId,
    };
  }

  if (status === 409) {
    return {
      status,
      mensaje: "Ya existe un registro con esos datos.",
      detalle: null,
      requestId,
    };
  }

  if (status === 422) {
    const detalle = problema.detail ?? null;
    return {
      status,
      mensaje: detalle ?? "Revisa los datos del formulario.",
      detalle,
      requestId,
    };
  }

  if (status === 429) {
    return {
      status,
      mensaje:
        "Demasiados intentos seguidos. Espera un minuto e inténtalo de nuevo.",
      detalle: null,
      requestId,
    };
  }

  return { status, mensaje: GENERICO, detalle: null, requestId };
}
