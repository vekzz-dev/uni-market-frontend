import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SelectorTema, useTema } from "../tema.js";

export function Boton({
  titulo,
  onPress,
  variante = "primario",
  cargando = false,
  disabled = false,
  style,
}) {
  const { semantic: c } = useTema();
  const primario = variante === "primario";
  const fondo = primario ? c.primary : c.surface;
  const tinta = primario ? c.textOnPrimary : c.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || cargando}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        {
          backgroundColor: fondo,
          borderColor: primario ? "transparent" : c.borderField,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={tinta} />
      ) : (
        <Text style={{ color: tinta, fontWeight: "600", fontSize: 15 }}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

export function Campo({
  etiqueta,
  valor,
  onChangeText,
  ayuda,
  error,
  ...props
}) {
  const { semantic: c } = useTema();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: "500" }}>
        {etiqueta}
      </Text>
      <TextInput
        value={valor}
        onChangeText={onChangeText}
        placeholderTextColor={c.textSecondary}
        style={{
          minHeight: 46,
          borderWidth: 1,
          borderColor: error ? c.error : c.borderField,
          borderRadius: 8,
          paddingHorizontal: 12,
          color: c.text,
          backgroundColor: c.surface,
        }}
        {...props}
      />
      {error || ayuda ? (
        <Text
          style={{ color: error ? c.errorText : c.textSecondary, fontSize: 12 }}
        >
          {error ?? ayuda}
        </Text>
      ) : null}
    </View>
  );
}

const TONOS = {
  error: ["errorSoft", "errorText"],
  advertencia: ["warningSoft", "warningText"],
  exito: ["successSoft", "successText"],
  info: ["primarySoft", "primaryStrong"],
};

export function Aviso({ tono = "error", children }) {
  const { semantic: c } = useTema();
  const [fondo, tinta] = TONOS[tono] ?? TONOS.error;
  return (
    <View
      accessibilityRole="alert"
      style={[estilos.aviso, { backgroundColor: c[fondo] }]}
    >
      <Text style={{ color: c[tinta], fontSize: 13 }}>{children}</Text>
    </View>
  );
}

export function Cabecera({ children }) {
  const { semantic: c } = useTema();
  return (
    <View
      style={[
        estilos.cabecera,
        { backgroundColor: c.surface, borderBottomColor: c.border },
      ]}
    >
      <View style={[estilos.logo, { backgroundColor: c.primary }]} />
      <Text style={{ color: c.text, fontSize: 16, fontWeight: "600" }}>
        Uni Market
      </Text>
      <View style={{ flex: 1 }} />
      <SelectorTema />
      {children}
    </View>
  );
}

export function Tarjeta({ children }) {
  const { semantic: c } = useTema();
  return (
    <View
      style={[
        estilos.tarjeta,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      {children}
    </View>
  );
}

export function Estado({ children }) {
  const { semantic: c } = useTema();
  return (
    <Text
      accessibilityRole="text"
      style={{ color: c.textSecondary, textAlign: "center", padding: 24 }}
    >
      {children}
    </Text>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  aviso: { padding: 12, borderRadius: 8 },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  logo: { width: 28, height: 28, borderRadius: 8 },
  tarjeta: { borderWidth: 1, borderRadius: 12 },
});
