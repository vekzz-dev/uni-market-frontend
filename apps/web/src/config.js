// Configuración por entorno (D15). El origen de medios se deriva de la base.
export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/v1";

export const origenApi = apiBaseUrl.replace(/\/v1\/?$/, "");
