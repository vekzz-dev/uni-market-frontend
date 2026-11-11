import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  mapearProblema,
  validarEmail,
  validarPin,
  validarRegistro,
} from "@uni-market/core";
import { Aviso, Boton, Campo, Cabecera } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

function Pantalla({ titulo, subtitulo, children }) {
  const { semantic: c } = useTema();
  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View
            style={{
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 16,
              padding: 20,
              gap: 16,
            }}
          >
            <View style={{ gap: 6 }}>
              <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
                {titulo}
              </Text>
              {subtitulo && (
                <Text style={{ color: c.textSecondary }}>{subtitulo}</Text>
              )}
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function Entrar() {
  const { sesion } = useSesion();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  async function enviar() {
    setError(null);
    setEnviando(true);
    try {
      await sesion.iniciarSesion({ email, contrasena });
      router.replace("/");
    } catch (fallo) {
      const { mensaje, status } = mapearProblema(fallo);
      setError(mensaje);
      if (status === 429) setBloqueado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla
      titulo="Entrar"
      subtitulo="Accede a tu cuenta para publicar y conversar."
    >
      {error && <Aviso>{error}</Aviso>}
      <Campo
        etiqueta="Correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Campo
        etiqueta="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
      />
      <Boton
        titulo={enviando ? "Entrando…" : "Entrar"}
        cargando={enviando}
        disabled={bloqueado}
        onPress={enviar}
      />
      <Boton
        titulo="Crear cuenta"
        variante="secundario"
        onPress={() => router.push("/registro")}
      />
      <Boton
        titulo="¿Olvidaste tu contraseña?"
        variante="secundario"
        onPress={() => router.push("/restablecer")}
      />
      <Boton
        titulo="Reenviar confirmación"
        variante="secundario"
        onPress={() => router.push("/reenviar")}
      />
    </Pantalla>
  );
}

export function Registro() {
  const { cliente } = useSesion();
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", email: "", contrasena: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setError(null);
    const problemas = validarRegistro(form);
    if (problemas.length > 0) {
      setErrores(
        Object.fromEntries(problemas.map((p) => [p.campo, p.mensaje])),
      );
      return;
    }
    setErrores({});
    setEnviando(true);
    try {
      await cliente.usuarios.registrarUsuario(form);
      // La cuenta queda sin confirmar: el login fallará hasta meter el PIN.
      router.replace({ pathname: "/confirmar", params: { email: form.email } });
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla
      titulo="Crear cuenta"
      subtitulo="Publica y conversa en el marketplace universitario."
    >
      {error && <Aviso>{error}</Aviso>}
      <Campo
        etiqueta="Nombre"
        value={form.nombre}
        onChangeText={(nombre) => setForm((f) => ({ ...f, nombre }))}
        error={errores.nombre}
      />
      <Campo
        etiqueta="Correo"
        value={form.email}
        onChangeText={(email) => setForm((f) => ({ ...f, email }))}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errores.email}
      />
      <Campo
        etiqueta="Contraseña"
        value={form.contrasena}
        onChangeText={(contrasena) => setForm((f) => ({ ...f, contrasena }))}
        secureTextEntry
        ayuda="Mínimo 8 caracteres."
        error={errores.contrasena}
      />
      <Boton
        titulo={enviando ? "Creando cuenta…" : "Crear cuenta"}
        cargando={enviando}
        onPress={enviar}
      />
      <Boton
        titulo="Ya tengo cuenta"
        variante="secundario"
        onPress={() => router.push("/entrar")}
      />
    </Pantalla>
  );
}

export function Confirmar() {
  const { cliente } = useSesion();
  const router = useRouter();
  const { email: emailDeRuta } = useLocalSearchParams();
  const [email, setEmail] = useState(emailDeRuta ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  async function enviar() {
    setError(null);

    const problemaEmail = validarEmail(email);
    if (problemaEmail) {
      setError(problemaEmail);
      return;
    }
    const problemaPin = validarPin(pin);
    if (problemaPin) {
      setError(problemaPin);
      return;
    }

    setEnviando(true);
    try {
      await cliente.auth.confirmarEmail({ email: email.trim(), pin });
      setConfirmado(true);
    } catch (fallo) {
      // El 422 es indistinguible a propósito: se muestra tal cual (R13).
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (confirmado) {
    return (
      <Pantalla
        titulo="Cuenta confirmada"
        subtitulo="Ya puedes entrar y publicar tus anuncios."
      >
        <Boton titulo="Entrar" onPress={() => router.replace("/entrar")} />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Confirma tu cuenta"
      subtitulo="Escribe el código de 6 dígitos que enviamos a tu correo."
    >
      {error && <Aviso>{error}</Aviso>}
      <Campo
        etiqueta="Correo"
        valor={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Campo
        etiqueta="Código"
        valor={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={6}
        ayuda="Seis dígitos. Vence en 15 minutos y admite 5 intentos."
      />
      <Boton
        titulo={enviando ? "Confirmando…" : "Confirmar cuenta"}
        cargando={enviando}
        onPress={enviar}
      />
      <Boton
        titulo="Reenviar el código"
        variante="secundario"
        onPress={() => router.push("/reenviar")}
      />
    </Pantalla>
  );
}

export function Restablecer() {
  const { cliente } = useSesion();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setError(null);
    setEnviando(true);
    try {
      await cliente.auth.solicitarRestablecimiento({ email });
      // El código llega por correo; se sigue en el formulario que lo pide.
      router.replace({ pathname: "/nueva-contrasena", params: { email } });
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla
      titulo="Restablecer contraseña"
      subtitulo="Te enviaremos un código para crear una nueva."
    >
      {error && <Aviso>{error}</Aviso>}
      <Campo
        etiqueta="Correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Boton
        titulo={enviando ? "Enviando…" : "Enviar código"}
        cargando={enviando}
        onPress={enviar}
      />
    </Pantalla>
  );
}

export function Reenviar() {
  const { cliente } = useSesion();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setError(null);
    setEnviando(true);
    try {
      await cliente.auth.reenviarConfirmacion({ email });
      router.replace({ pathname: "/confirmar", params: { email } });
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla
      titulo="Reenviar confirmación"
      subtitulo="Te enviamos otro código para confirmar tu cuenta."
    >
      {error && <Aviso>{error}</Aviso>}
      <Campo
        etiqueta="Correo"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Boton
        titulo={enviando ? "Enviando…" : "Enviar código"}
        cargando={enviando}
        onPress={enviar}
      />
    </Pantalla>
  );
}

export function NuevaContrasena() {
  const { cliente } = useSesion();
  const router = useRouter();
  const { email: emailDeRuta } = useLocalSearchParams();
  const [email, setEmail] = useState(emailDeRuta ?? "");
  const [pin, setPin] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  async function enviar() {
    setError(null);

    const problemaEmail = validarEmail(email);
    if (problemaEmail) {
      setError(problemaEmail);
      return;
    }
    const problemaPin = validarPin(pin);
    if (problemaPin) {
      setError(problemaPin);
      return;
    }
    if (nueva.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nueva !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      await cliente.auth.confirmarRestablecimiento({
        email: email.trim(),
        pin,
        nuevaContrasena: nueva,
      });
      setListo(true);
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <Pantalla
        titulo="Contraseña actualizada"
        subtitulo="Ya puedes entrar con tu nueva contraseña."
      >
        <Boton titulo="Entrar" onPress={() => router.replace("/entrar")} />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Nueva contraseña"
      subtitulo="Escribe el código de 6 dígitos que enviamos a tu correo y elige una contraseña nueva."
    >
      {error && <Aviso>{error}</Aviso>}
      <Campo
        etiqueta="Correo"
        valor={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Campo
        etiqueta="Código"
        valor={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={6}
        ayuda="Seis dígitos. Vence en 15 minutos y admite 5 intentos."
      />
      <Campo
        etiqueta="Nueva contraseña"
        valor={nueva}
        onChangeText={setNueva}
        secureTextEntry
        ayuda="Mínimo 8 caracteres."
      />
      <Campo
        etiqueta="Repetir contraseña"
        valor={repetir}
        onChangeText={setRepetir}
        secureTextEntry
      />
      <Boton
        titulo={enviando ? "Guardando…" : "Guardar contraseña"}
        cargando={enviando}
        onPress={enviar}
      />
      <Boton
        titulo="Pedir otro código"
        variante="secundario"
        onPress={() => router.push("/restablecer")}
      />
    </Pantalla>
  );
}
