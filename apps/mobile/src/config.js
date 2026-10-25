// En dispositivo/emulador hay que apuntar EXPO_PUBLIC_API_BASE_URL a la IP de la máquina.
export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080/v1";
export const origenApi = apiBaseUrl.replace(/\/v1\/?$/, "");
