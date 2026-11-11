/**
 * `config.js` resuelve la base de la API en el momento del import, así que cada
 * caso reinicia los módulos y vuelve a montar `expo-constants` antes de cargarlo.
 */
function cargarConfig({ hostUri, debuggerHost, envApi } = {}) {
  jest.resetModules();

  if (envApi === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = envApi;
  }

  jest.doMock("expo-constants", () => ({
    __esModule: true,
    default: {
      expoConfig: hostUri === undefined ? null : { hostUri },
      expoGoConfig: debuggerHost === undefined ? null : { debuggerHost },
    },
  }));

  return require("../src/config.js");
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
});

it("deriva el host de la API desde el hostUri de Metro", () => {
  const { apiBaseUrl, origenApi } = cargarConfig({
    hostUri: "192.168.0.3:8081",
  });

  expect(apiBaseUrl).toBe("http://192.168.0.3:8080/v1");
  expect(origenApi).toBe("http://192.168.0.3:8080");
});

it("sigue la IP aunque la red cambie de rango", () => {
  const { apiBaseUrl } = cargarConfig({ hostUri: "192.168.43.117:8081" });

  expect(apiBaseUrl).toBe("http://192.168.43.117:8080/v1");
});

it("recurre a debuggerHost cuando no hay hostUri", () => {
  const { apiBaseUrl } = cargarConfig({ debuggerHost: "10.0.0.5:8081" });

  expect(apiBaseUrl).toBe("http://10.0.0.5:8080/v1");
});

it("la variable explícita gana sobre la inferencia", () => {
  const { apiBaseUrl, origenApi } = cargarConfig({
    hostUri: "192.168.0.3:8081",
    envApi: "https://api.uni-market.test/v1",
  });

  expect(apiBaseUrl).toBe("https://api.uni-market.test/v1");
  expect(origenApi).toBe("https://api.uni-market.test");
});

it("cae a localhost cuando no hay Metro ni variable explícita", () => {
  const { apiBaseUrl } = cargarConfig();

  expect(apiBaseUrl).toBe("http://localhost:8080/v1");
});
