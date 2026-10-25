import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const CLAVE = "umi.refresh";

const almacenWeb = {
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
      // Sin almacén disponible: la sesión sigue en memoria.
    }
  },
  async borrar() {
    try {
      globalThis.localStorage?.removeItem(CLAVE);
    } catch {
      // Sin almacén disponible: la sesión sigue en memoria.
    }
  },
};

const almacenNativo = {
  async leer() {
    try {
      return await SecureStore.getItemAsync(CLAVE);
    } catch {
      return null;
    }
  },
  async escribir(valor) {
    try {
      await SecureStore.setItemAsync(CLAVE, valor);
    } catch {
      // Sin almacén disponible: la sesión sigue en memoria.
    }
  },
  async borrar() {
    try {
      await SecureStore.deleteItemAsync(CLAVE);
    } catch {
      // Sin almacén disponible: la sesión sigue en memoria.
    }
  },
};

export function crearAlmacenSeguro() {
  return Platform.OS === "web" ? almacenWeb : almacenNativo;
}
