import * as SecureStore from "expo-secure-store";
import { crearAlmacenSeguro } from "../src/sesion/almacenSeguro.js";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("almacén seguro de la sesión", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lee el refresh del SecureStore", async () => {
    SecureStore.getItemAsync.mockResolvedValue("r1");

    expect(await crearAlmacenSeguro().leer()).toBe("r1");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("umi.refresh");
  });

  it("sigue en memoria si el almacén falla", async () => {
    SecureStore.getItemAsync.mockRejectedValue(new Error("no disponible"));

    expect(await crearAlmacenSeguro().leer()).toBeNull();
  });

  it("escribe y borra el refresh", async () => {
    await crearAlmacenSeguro().escribir("r2");
    await crearAlmacenSeguro().borrar();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("umi.refresh", "r2");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("umi.refresh");
  });
});
