import Constants from "expo-constants";

// El puerto de la API no cambia entre redes; solo cambia el host.
const PUERTO_API = 8080;

/**
 * Metro publica en `hostUri` la dirección con la que está sirviendo el bundle,
 * así que en desarrollo apunta a la máquina donde corre la API: en LAN, en un
 * hotspot o en cualquier otra red, sin tocar el `.env`.
 */
function hostDeMetro() {
  const uri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    null;

  if (!uri) return null;

  return uri.split(":")[0] || null;
}

const explicito = process.env.EXPO_PUBLIC_API_BASE_URL;
const derivado = hostDeMetro();

export const apiBaseUrl =
  explicito ??
  (derivado
    ? `http://${derivado}:${PUERTO_API}/v1`
    : "http://localhost:8080/v1");

export const origenApi = apiBaseUrl.replace(/\/v1\/?$/, "");
