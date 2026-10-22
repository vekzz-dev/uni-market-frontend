import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { crearCliente } from '@uni-market/api-client';
import { crearGestorSesion } from '@uni-market/core';
import { apiBaseUrl } from '../config.js';
import { crearAlmacenWeb } from './almacenWeb.js';

// Se exporta para poder inyectar un valor falso en las pruebas.
export const SesionContexto = createContext(null);

export function SesionProvider({ children }) {
  const [estado, setEstado] = useState({ estado: 'anonimo', usuario: null });
  const gestorRef = useRef(null);
  const clienteRef = useRef(null);
  const restaurado = useRef(false);

  if (!gestorRef.current) {
    clienteRef.current = crearCliente({
      baseUrl: apiBaseUrl,
      getAccessToken: () => gestorRef.current?.obtenerAccessToken() ?? null,
    });
    gestorRef.current = crearGestorSesion({
      auth: clienteRef.current.auth,
      almacen: crearAlmacenWeb(),
      alCambiar: setEstado,
    });
  }

  useEffect(() => {
    // StrictMode ejecuta el efecto dos veces: restaurar dos veces rotaría dos veces.
    if (restaurado.current) return;
    restaurado.current = true;
    gestorRef.current.restaurar().catch(() => {});
  }, []);

  return (
    <SesionContexto.Provider value={{ cliente: clienteRef.current, sesion: gestorRef.current, estado }}>
      {children}
    </SesionContexto.Provider>
  );
}

export function useSesion() {
  const valor = useContext(SesionContexto);
  if (!valor) throw new Error('useSesion necesita estar dentro de <SesionProvider>');
  return valor;
}
