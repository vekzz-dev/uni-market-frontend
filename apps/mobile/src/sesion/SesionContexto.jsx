import { createContext, useContext, useEffect, useRef, useState } from "react";
import { crearCliente } from "@uni-market/api-client";
import { crearGestorSesion } from "@uni-market/core";
import { apiBaseUrl } from "../config.js";
import { crearAlmacenSeguro } from "./almacenSeguro.js";

export const SesionContexto = createContext(null);

export function SesionProvider({ children }) {
  const [estado, setEstado] = useState({ estado: "anonimo", usuario: null });
  // `false` hasta que termina la restauración: los guards esperan para no
  // expulsar a entrar con un refresh válido guardado.
  const [restaurado, setRestaurado] = useState(false);
  const [recursos] = useState(() => {
    let gestor = null;
    const cliente = crearCliente({
      baseUrl: apiBaseUrl,
      getAccessToken: () => gestor?.obtenerAccessToken() ?? null,
    });
    gestor = crearGestorSesion({
      auth: cliente.auth,
      almacen: crearAlmacenSeguro(),
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
  if (!valor) throw new Error("useSesion necesita <SesionProvider>");
  return valor;
}
