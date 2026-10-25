// Almacén del refresh token en web: localStorage.
// El access token NUNCA se persiste (vive en el gestor de sesión, en memoria).

const CLAVE = "umi.refresh";

export function crearAlmacenWeb() {
  return {
    async leer() {
      try {
        return globalThis.localStorage?.getItem(CLAVE) ?? null;
      } catch {
        return null;
      }
    },
    async escribir(valor) {
      try {
        globalThis.localStorage?.setItem(CLAVE, valor);
      } catch {
        // Modo privado o cuota llena: la sesión sigue en memoria.
      }
    },
    async borrar() {
      try {
        globalThis.localStorage?.removeItem(CLAVE);
      } catch {
        // Idem.
      }
    },
  };
}
