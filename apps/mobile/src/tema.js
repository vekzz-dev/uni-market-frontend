import { createContext, useContext } from "react";

export const TemaContexto = createContext(null);

export function useTema() {
  const tema = useContext(TemaContexto);
  if (!tema) throw new Error("useTema necesita <TemaContexto.Provider>");
  return tema;
}
