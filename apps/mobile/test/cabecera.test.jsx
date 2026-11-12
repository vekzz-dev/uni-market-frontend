// La cabecera debe apartarse de la barra de estado del sistema: en un teléfono
// con notch el inset superior ronda los 47 px, y sin él el logo queda debajo.
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { themeFor } from "@uni-market/design-tokens";
import { Cabecera } from "../src/componentes/ui.jsx";
import { TemaContexto } from "../src/tema.js";

const INSET_SUPERIOR = 47;
const INSET_INFERIOR = 34;

jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context/jest/mock").default,
  useSafeAreaInsets: () => ({
    top: INSET_SUPERIOR,
    bottom: INSET_INFERIOR,
    left: 0,
    right: 0,
  }),
}));

it("la cabecera se aparta de la barra de estado", async () => {
  const vista = await render(
    <TemaContexto.Provider
      value={{ ...themeFor("light"), modo: "claro", cambiar: jest.fn() }}
    >
      <Cabecera />
    </TemaContexto.Provider>,
  );

  const plano = StyleSheet.flatten(vista.toJSON().props.style);

  expect(plano.paddingTop).toBe(INSET_SUPERIOR);
  // El fondo sigue cubriendo la franja: el contenido baja, el color no
  expect(plano.backgroundColor).toBeTruthy();
  expect(plano.minHeight).toBe(56);
});
