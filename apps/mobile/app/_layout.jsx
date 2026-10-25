import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SesionProvider } from "../src/sesion/SesionContexto.jsx";
import { TemaProvider, useTema } from "../src/tema.js";

function Navegacion() {
  const { semantic, mode } = useTema();
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: semantic.bg },
        }}
      />
    </>
  );
}

export default function Layout() {
  return (
    <TemaProvider>
      <SesionProvider>
        <Navegacion />
      </SesionProvider>
    </TemaProvider>
  );
}
