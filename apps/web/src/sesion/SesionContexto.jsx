import { createContext, useContext, useEffect, useRef, useState } from "react";
import { crearCliente } from "@uni-market/api-client";
import { crearGestorSesion } from "@uni-market/core";
import { apiBaseUrl } from "../config.js";
import { crearAlmacenWeb } from "./almacenWeb.js";

// Se exporta para poder inyectar un valor falso en las pruebas.
export const SesionContexto = createContext(null);

export function SesionProvider({ children }) {
  const [estado, setEstado] = useState({ estado: "anonimo", usuario: null });
  // `false` hasta que la restauración al arrancar termina: los guards de ruta
  // esperan a este flag para no expulsar a entrar con un refresh válido guardado.
  const [restaurado, setRestaurado] = useState(false);

  // Se crea una sola vez. `gestor` se asigna dentro del inicializador para que la
  // closure de `getAccessToken` lo vea sin tocar refs durante el render.
  const [recursos] = useState(() => {
    let gestor = null;
    const cliente = crearCliente({
      baseUrl: apiBaseUrl,
      getAccessToken: () => gestor?.obtenerAccessToken() ?? null,
    });
    gestor = crearGestorSesion({
      auth: cliente.auth,
      almacen: crearAlmacenWeb(),
      alCambiar: setEstado,
    });
    return { cliente, sesion: gestor };
  });

  const restauracionIniciada = useRef(false);

  useEffect(() => {
    // StrictMode ejecuta el efecto dos veces: restaurar dos veces rotaría dos veces.
    if (restauracionIniciada.current) return;
    restauracionIniciada.current = true;
    recursos.sesion
      .restaurar()
      .catch(() => {})
      .finally(() => setRestaurado(true));
  }, [recursos]);

  return (
    <SesionContexto.Provider
      value={{
        cliente: recursos.cliente,
        sesion: recursos.sesion,
        estado,
        restaurado,
      }}
    >
      {children}
    </SesionContexto.Provider>
  );
}

export function useSesion() {
  const valor = useContext(SesionContexto);
  if (!valor)
    throw new Error("useSesion necesita estar dentro de <SesionProvider>");
  return valor;
}
