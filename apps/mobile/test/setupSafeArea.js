// `useSafeAreaInsets` lanza si no hay `SafeAreaProvider`. En las pruebas no
// montamos el layout raíz, así que se usa el mock de la librería. Viene en
// `default` (interop ESM), no como export con nombre.
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
