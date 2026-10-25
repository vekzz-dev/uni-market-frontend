import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { mapearProblema, validarRegistro } from "@uni-market/core";
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
  const [enviado, setEnviado] = useState(false);

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
      setEnviado(true);
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Pantalla
        titulo="Revisa tu correo"
        subtitulo={`Te enviamos un enlace de confirmación a ${form.email}. Vence en 24 horas.`}
      >
        <Boton
          titulo="Ir a entrar"
          variante="secundario"
          onPress={() => router.replace("/entrar")}
        />
      </Pantalla>
    );
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

const RESULTADOS = {
  verificando: "Confirmando tu cuenta…",
  confirmado: "Cuenta confirmada",
  invalido: "El enlace no es válido",
};

export function Confirmar() {
  const { cliente } = useSesion();
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [estado, setEstado] = useState(token ? "verificando" : "invalido");
  const { semantic: c } = useTema();

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    cliente.auth
      .confirmarEmail(token)
      .then(() => vigente && setEstado("confirmado"))
      .catch(() => vigente && setEstado("invalido"));
    return () => {
      vigente = false;
    };
  }, [cliente, token]);

  return (
    <Pantalla titulo={RESULTADOS[estado]}>
      {estado === "confirmado" && (
        <Boton titulo="Entrar" onPress={() => router.replace("/entrar")} />
      )}
      {estado === "invalido" && (
        <>
          <Text style={{ color: c.textSecondary }}>
            Puede que haya expirado o que ya se haya usado.
          </Text>
          <Boton
            titulo="Reenviar confirmación"
            onPress={() => router.push("/reenviar")}
          />
        </>
      )}
    </Pantalla>
  );
}

export function Restablecer() {
  const { cliente } = useSesion();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    setError(null);
    setEnviando(true);
    try {
      await cliente.auth.solicitarRestablecimiento({ email });
      setEnviado(true);
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Pantalla
        titulo="Revisa tu correo"
        subtitulo="Si existe una cuenta con ese correo, te enviamos un enlace. Vence en 60 minutos."
      >
        <Boton
          titulo="Volver a entrar"
          variante="secundario"
          onPress={() => router.replace("/entrar")}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Restablecer contraseña"
      subtitulo="Te enviaremos un enlace para crear una nueva."
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
        titulo={enviando ? "Enviando…" : "Enviar enlace"}
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
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    setError(null);
    setEnviando(true);
    try {
      await cliente.auth.reenviarConfirmacion({ email });
      setEnviado(true);
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Pantalla
        titulo="Revisa tu correo"
        subtitulo="Si existe una cuenta sin confirmar, te enviamos otro enlace."
      >
        <Boton
          titulo="Volver a entrar"
          variante="secundario"
          onPress={() => router.replace("/entrar")}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Reenviar confirmación"
      subtitulo="Te enviamos otro enlace para confirmar tu cuenta."
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
        titulo={enviando ? "Enviando…" : "Enviar enlace"}
        cargando={enviando}
        onPress={enviar}
      />
    </Pantalla>
  );
}

export function NuevaContrasena() {
  const { cliente } = useSesion();
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState(null);
  const [estado, setEstado] = useState(token ? "formulario" : "invalido");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setError(null);
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
        token,
        nuevaContrasena: nueva,
      });
      setEstado("listo");
    } catch (fallo) {
      const { status } = mapearProblema(fallo);
      if (status >= 400 && status < 500) setEstado("invalido");
      else setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (estado === "invalido") {
    return (
      <Pantalla
        titulo="El enlace no es válido"
        subtitulo="Solicita uno nuevo para continuar."
      >
        <Boton
          titulo="Solicitar enlace"
          onPress={() => router.replace("/restablecer")}
        />
      </Pantalla>
    );
  }

  if (estado === "listo") {
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
      subtitulo="Elige una contraseña de al menos 8 caracteres."
    >
      {error && <Aviso>{error}</Aviso>}
      <Campo
        etiqueta="Nueva contraseña"
        value={nueva}
        onChangeText={setNueva}
        secureTextEntry
        ayuda="Mínimo 8 caracteres."
      />
      <Campo
        etiqueta="Repetir contraseña"
        value={repetir}
        onChangeText={setRepetir}
        secureTextEntry
      />
      <Boton
        titulo={enviando ? "Guardando…" : "Guardar contraseña"}
        cargando={enviando}
        onPress={enviar}
      />
    </Pantalla>
  );
}
