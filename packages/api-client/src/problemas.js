// Forma del error de la API (RFC 9457 `application/problem+json`).
// El contrato no expone un código de máquina: la clasificación se hace por estado
// HTTP y `title`/`detail` solo se muestran como texto (nunca como HTML).

/** Error de transporte que conserva el problema RFC 9457 y el X-Request-Id. */
export class ApiError extends Error {
  constructor(
    mensaje,
    { status = 0, problem = null, requestId = null, response = null } = {},
  ) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
    this.requestId = requestId;
    this.response = response;
  }
}

/**
 * Normaliza cualquier fallo a la forma que consume `core/errores`.
 * No inventa mensajes de negocio: conserva `detail` para mostrarlo tal cual.
 */
export function normalizarProblema(error) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      type: error.problem?.type ?? null,
      title: error.problem?.title ?? error.message,
      detail: error.problem?.detail ?? null,
      requestId: error.requestId,
    };
  }
  return {
    status: 0,
    type: null,
    title: "Error de red",
    detail: error?.message ?? null,
    requestId: null,
  };
}
