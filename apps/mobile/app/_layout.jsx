import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { themeFor } from "@uni-market/design-tokens";
import { SesionProvider } from "../src/sesion/SesionContexto.jsx";
import { TemaContexto } from "../src/tema.js";

export default function Layout() {
  const esquema = useColorScheme();
  const tema = themeFor(esquema === "dark" ? "dark" : "light");

  return (
    <TemaContexto.Provider value={tema}>
      <SesionProvider>
        <StatusBar style={esquema === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tema.semantic.bg },
          }}
        />
      </SesionProvider>
    </TemaContexto.Provider>
  );
}
