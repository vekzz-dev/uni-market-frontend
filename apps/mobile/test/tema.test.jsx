import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Text } from "react-native";
import { SelectorTema, TemaProvider, useTema } from "../src/tema.js";

function Sonda() {
  const { modo } = useTema();
  return (
    <>
      <Text>{modo}</Text>
      <SelectorTema />
    </>
  );
}

it("arranca en sistema y cicla a claro", async () => {
  render(
    <TemaProvider>
      <Sonda />
    </TemaProvider>,
  );
  await waitFor(() => expect(screen.getByText("sistema")).toBeTruthy());
  fireEvent.press(screen.getByRole("button", { name: /Tema Auto/ }));
  await waitFor(() => expect(screen.getByText("claro")).toBeTruthy());
});
