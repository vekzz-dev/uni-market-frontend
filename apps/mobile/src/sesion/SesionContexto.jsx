import { createContext, useContext, useEffect, useRef, useState } from "react";
import { crearCliente } from "@uni-market/api-client";
import { crearGestorSesion } from "@uni-market/core";
import { apiBaseUrl } from "../config.js";
import { crearAlmacenSeguro } from "./almacenSeguro.js";

export const SesionContexto = createContext(null);

export function SesionProvider({ children }) {
  const [estado, setEstado] = useState({ estado: "anonimo", usuario: null });
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
  const restaurado = useRef(false);

  useEffect(() => {
    if (restaurado.current) return;
    restaurado.current = true;
    recursos.sesion.restaurar().catch(() => {});
  }, [recursos]);

  return (
    <SesionContexto.Provider
      value={{ cliente: recursos.cliente, sesion: recursos.sesion, estado }}
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
