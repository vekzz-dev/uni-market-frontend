// Canal de coordinación entre pestañas para la sesión (docs/api-integration.md §2).
//
// El refresh token rota en cada uso: si dos pestañas refrescan a la vez con el
// mismo token, la segunda recibe 401 y se cerrarían ambas sesiones. Con el canal,
// la que refresca publica el par nuevo y las demás lo adoptan.

const NOMBRE = "umi.sesion";

/**
 * @returns {{ publicar: (mensaje: Object) => void, suscribir: (cb: Function) => void, cerrar: () => void } | null}
 */
export function crearCanalWeb(nombre = NOMBRE) {
  if (typeof BroadcastChannel !== "function") return null;

  const canal = new BroadcastChannel(nombre);

  return {
    publicar(mensaje) {
      canal.postMessage(mensaje);
    },
    suscribir(callback) {
      canal.addEventListener("message", (evento) => callback(evento.data));
    },
    cerrar() {
      canal.close();
    },
  };
}
