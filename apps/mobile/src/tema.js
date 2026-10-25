import { createContext, useContext, useEffect, useState } from "react";
import { Platform, Pressable, Text, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { themeFor } from "@uni-market/design-tokens";

const CLAVE = "umi.tema";
export const MODOS = ["sistema", "claro", "oscuro"];
const ETIQUETAS = { sistema: "Auto", claro: "Claro", oscuro: "Oscuro" };

export const TemaContexto = createContext(null);

async function leerModo() {
  try {
    const valor =
      Platform.OS === "web"
        ? globalThis.localStorage?.getItem(CLAVE)
        : await SecureStore.getItemAsync(CLAVE);
    return MODOS.includes(valor) ? valor : "sistema";
  } catch {
    // Sin almacén: se queda en sistema.
    return "sistema";
  }
}

async function guardarModo(modo) {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(CLAVE, modo);
    else await SecureStore.setItemAsync(CLAVE, modo);
  } catch {
    // El tema se aplica igual; solo no persiste.
  }
}

export function TemaProvider({ children }) {
  const esquema = useColorScheme();
  const [modo, setModo] = useState("sistema");

  useEffect(() => {
    let vigente = true;
    leerModo().then((guardado) => vigente && setModo(guardado));
    return () => {
      vigente = false;
    };
  }, []);

  const resuelto =
    modo === "sistema" ? (esquema === "dark" ? "oscuro" : "claro") : modo;
  const tema = themeFor(resuelto === "oscuro" ? "dark" : "light");

  function cambiar() {
    const siguiente = MODOS[(MODOS.indexOf(modo) + 1) % MODOS.length];
    setModo(siguiente);
    guardarModo(siguiente);
  }

  return (
    <TemaContexto.Provider value={{ ...tema, modo, cambiar }}>
      {children}
    </TemaContexto.Provider>
  );
}

export function useTema() {
  const tema = useContext(TemaContexto);
  if (!tema) throw new Error("useTema necesita <TemaProvider>");
  return tema;
}

export function SelectorTema() {
  const { modo, cambiar, semantic: c } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tema ${ETIQUETAS[modo]}; cambiar`}
      onPress={cambiar}
      style={{
        minHeight: 34,
        paddingHorizontal: 10,
        justifyContent: "center",
        borderWidth: 1,
        borderColor: c.borderField,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: c.text, fontSize: 12, fontWeight: "600" }}>
        {ETIQUETAS[modo]}
      </Text>
    </Pressable>
  );
}
