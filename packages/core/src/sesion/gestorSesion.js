// Máquina de estados de la sesión, independiente de la plataforma.
//
// Contrato (docs/api-integration.md §2):
// - El access token vive SOLO en memoria; el refresh se persiste con el almacén inyectado.
// - Refresco proactivo antes de que expire y refresco reactivo de vuelo único ante 401.
// - Un segundo 401 tras el reintento es irreversible → estado `expirado` y almacén limpio.
// - El refresh rota: cada respuesta trae un token nuevo que se persiste antes de publicarlo.

export const ESTADOS = Object.freeze({
  ANONIMO: 'anonimo',
  AUTENTICADO: 'autenticado',
  EXPIRADO: 'expirado',
});

/**
 * @param {Object} opciones
 * @param {Object} opciones.auth  Objeto con iniciarSesion/refrescarSesion/cerrarSesion (api-client)
 * @param {Object} opciones.almacen  { leer(): Promise<string|null>, escribir(v), borrar() }
 * @param {() => number} [opciones.reloj]  Inyectable para pruebas
 * @param {number} [opciones.margenMs]  Margen para refresco proactivo
 * @param {(estado: Object) => void} [opciones.alCambiar]
 * @param {Object|null} [opciones.canal]  { publicar(msg), suscribir(cb) } para coordinar pestañas
 */
export function crearGestorSesion({
  auth,
  almacen,
  reloj = () => Date.now(),
  margenMs = 60_000,
  alCambiar = () => {},
  canal = null,
} = {}) {
  if (!auth) throw new Error('crearGestorSesion necesita auth');
  if (!almacen) throw new Error('crearGestorSesion necesita almacen (leer/escribir/borrar)');

  let estado = ESTADOS.ANONIMO;
  let usuario = null;
  let accessToken = null;
  let expiraEn = 0;
  let refrescoEnVuelo = null;

  const foto = () => ({ estado, usuario, expiraEn });

  const aplicar = (sesion) => {
    accessToken = sesion.accessToken;
    expiraEn = reloj() + Number(sesion.expiraEnSegundos ?? 900) * 1000;
    usuario = sesion.usuario ?? usuario;
    estado = ESTADOS.AUTENTICADO;
    alCambiar(foto());
  };

  const expirar = async () => {
    accessToken = null;
    usuario = null;
    expiraEn = 0;
    estado = ESTADOS.EXPIRADO;
    try {
      await almacen.borrar();
    } catch {
      // El almacén no debe impedir cerrar la sesión.
    }
    alCambiar(foto());
  };

  const guardarRefresh = async (refreshToken) => {
    if (refreshToken) await almacen.escribir(refreshToken);
    else await almacen.borrar();
  };

  /** Refresco de vuelo único: las llamadas concurrentes comparten la misma promesa. */
  const refrescar = () => {
    if (refrescoEnVuelo) return refrescoEnVuelo;

    refrescoEnVuelo = (async () => {
      try {
        const refreshToken = await almacen.leer();
        if (!refreshToken) {
          await expirar();
          return null;
        }
        const sesion = await auth.refrescarSesion({ refreshToken });
        await guardarRefresh(sesion.refreshToken);
        aplicar(sesion);
        // Las demás pestañas adoptan el par nuevo (evita reutilizar un token rotado).
        canal?.publicar?.({ tipo: 'sesion-renovada', sesion });
        return sesion;
      } catch (error) {
        await expirar();
        throw error;
      } finally {
        refrescoEnVuelo = null;
      }
    })();

    return refrescoEnVuelo;
  };

  const asegurarToken = async () => {
    if (estado !== ESTADOS.AUTENTICADO) return null;
    if (!accessToken) {
      await refrescar();
      return accessToken;
    }
    if (expiraEn - reloj() <= margenMs) await refrescar();
    return accessToken;
  };

  /**
   * Ejecuta una operación autenticada con refresco transparente:
   * asegura token fresco y, ante un 401, refresca una vez y reintenta una sola vez.
   */
  const ejecutar = async (operacion) => {
    await asegurarToken();
    try {
      return await operacion();
    } catch (error) {
      if (error?.status !== 401 || estado !== ESTADOS.AUTENTICADO) throw error;

      try {
        await refrescar();
      } catch {
        throw error;
      }

      try {
        return await operacion();
      } catch (segundo) {
        if (segundo?.status === 401) await expirar();
        throw segundo;
      }
    }
  };

  const iniciarSesion = async (credenciales) => {
    const sesion = await auth.iniciarSesion(credenciales);
    await guardarRefresh(sesion.refreshToken);
    aplicar(sesion);
    return sesion;
  };

  const cerrarSesion = async () => {
    let refreshToken = null;
    try {
      refreshToken = await almacen.leer();
    } catch {
      refreshToken = null;
    }

    try {
      if (refreshToken) await auth.cerrarSesion({ refreshToken });
    } catch {
      // El contrato responde 204, pero el estado local se limpia igual.
    }

    accessToken = null;
    usuario = null;
    expiraEn = 0;
    estado = ESTADOS.ANONIMO;
    try {
      await almacen.borrar();
    } catch {
      // Idem.
    }
    alCambiar(foto());
  };

  /** Restaura la sesión al arrancar usando el refresh persistido. */
  const restaurar = async () => {
    let refreshToken = null;
    try {
      refreshToken = await almacen.leer();
    } catch {
      refreshToken = null;
    }

    if (!refreshToken) {
      estado = ESTADOS.ANONIMO;
      alCambiar(foto());
      return null;
    }

    try {
      return await refrescar();
    } catch {
      return null;
    }
  };

  /** Adopta un par emitido por otra pestaña (canal de coordinación). */
  const adoptarSesion = async (sesion) => {
    if (!sesion?.accessToken || !sesion?.refreshToken) return;
    await guardarRefresh(sesion.refreshToken);
    aplicar(sesion);
  };

  if (canal?.suscribir) {
    canal.suscribir((mensaje) => {
      if (mensaje?.tipo === 'sesion-renovada') adoptarSesion(mensaje.sesion);
    });
  }

  return {
    iniciarSesion,
    cerrarSesion,
    restaurar,
    refrescar,
    ejecutar,
    adoptarSesion,
    obtenerAccessToken: () => accessToken,
    obtenerEstado: foto,
  };
}
