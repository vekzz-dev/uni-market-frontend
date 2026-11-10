import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  mapearProblema,
  resolverUrlMedia,
  validarAvatar,
} from "@uni-market/core";
import { Aviso, Boton, Cabecera, Campo, Estado } from "../componentes/ui.jsx";
import { origenApi } from "../config.js";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

function aArchivo(asset) {
  return {
    uri: asset.uri,
    name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
    type: asset.mimeType ?? "image/jpeg",
    size: asset.fileSize,
  };
}

export function Perfil() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";

  const [vista, setVista] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [perfil, setPerfil] = useState(null);
  const [nombre, setNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState(null);
  const [avisoNombre, setAvisoNombre] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState(null);
  const [avisoAvatar, setAvisoAvatar] = useState(null);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [contrasena, setContrasena] = useState({
    actual: "",
    nueva: "",
    repetir: "",
  });
  const [errorContrasena, setErrorContrasena] = useState(null);
  const [avisoContrasena, setAvisoContrasena] = useState(null);
  const [cambiando, setCambiando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [errorBaja, setErrorBaja] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) router.replace("/entrar");
  }, [autenticado, restaurado, router]);

  useEffect(() => {
    if (!autenticado) return undefined;
    let vigente = true;
    setVista("cargando");
    setErrorCarga(null);

    sesion
      .ejecutar(() => cliente.usuarios.leerPerfilPropio())
      .then((datos) => {
        if (!vigente) return;
        setPerfil(datos);
        setNombre(datos.nombre ?? "");
        setVista("listo");
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 401) router.replace("/entrar");
        else {
          setErrorCarga(problema.mensaje);
          setVista("error");
        }
      });

    return () => {
      vigente = false;
    };
  }, [autenticado, cliente, recarga, router, sesion]);

  async function guardarNombre() {
    setErrorNombre(null);
    setAvisoNombre(null);
    if (!nombre.trim()) {
      setErrorNombre("Escribe tu nombre.");
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await sesion.ejecutar(() =>
        cliente.usuarios.actualizarPerfil({ nombre: nombre.trim() }),
      );
      setPerfil(actualizado);
      setNombre(actualizado.nombre);
      sesion.actualizarUsuario({
        nombre: actualizado.nombre,
        urlAvatar: actualizado.urlAvatar,
      });
      setAvisoNombre("Perfil actualizado.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorNombre(problema.mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function elegirAvatar() {
    setErrorAvatar(null);
    setAvisoAvatar(null);
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setErrorAvatar("Necesitamos acceso a tus fotos para cambiar el avatar.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (resultado.canceled) return;
    const archivo = aArchivo(resultado.assets[0]);
    const problemaArchivo = validarAvatar(archivo);
    if (problemaArchivo) {
      setErrorAvatar(problemaArchivo);
      return;
    }
    setSubiendoAvatar(true);
    try {
      const actualizado = await sesion.ejecutar(() =>
        cliente.usuarios.subirAvatar(archivo),
      );
      setPerfil(actualizado);
      sesion.actualizarUsuario({ urlAvatar: actualizado.urlAvatar });
      setAvisoAvatar("Foto actualizada.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorAvatar(problema.mensaje);
    } finally {
      setSubiendoAvatar(false);
    }
  }

  async function quitarAvatar() {
    setErrorAvatar(null);
    setAvisoAvatar(null);
    setSubiendoAvatar(true);
    try {
      await sesion.ejecutar(() => cliente.usuarios.eliminarAvatar());
      setPerfil((actual) => ({ ...actual, urlAvatar: null }));
      sesion.actualizarUsuario({ urlAvatar: null });
      setAvisoAvatar("Foto eliminada.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorAvatar(problema.mensaje);
    } finally {
      setSubiendoAvatar(false);
    }
  }

  async function cambiarContrasena() {
    setErrorContrasena(null);
    setAvisoContrasena(null);
    if (!contrasena.actual) {
      setErrorContrasena("Escribe tu contraseña actual.");
      return;
    }
    if (contrasena.nueva.length < 8) {
      setErrorContrasena("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (contrasena.nueva !== contrasena.repetir) {
      setErrorContrasena("Las contraseñas no coinciden.");
      return;
    }
    setCambiando(true);
    try {
      await sesion.ejecutar(() =>
        cliente.usuarios.cambiarContrasena({
          contrasenaActual: contrasena.actual,
          nuevaContrasena: contrasena.nueva,
        }),
      );
      setContrasena({ actual: "", nueva: "", repetir: "" });
      setAvisoContrasena("Contraseña actualizada.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorContrasena(problema.mensaje);
    } finally {
      setCambiando(false);
    }
  }

  async function darDeBaja() {
    setErrorBaja(null);
    setBajando(true);
    try {
      await sesion.ejecutar(() => cliente.usuarios.darDeBajaCuenta());
      await sesion.cerrarSesion();
      router.replace("/");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorBaja(problema.mensaje);
    } finally {
      setBajando(false);
    }
  }

  if (!restaurado || !autenticado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Inicia sesión para ver tu perfil
          </Text>
          <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
        </View>
      </View>
    );
  }

  if (vista === "cargando") {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <Estado>Cargando tu perfil…</Estado>
      </View>
    );
  }

  if (vista === "error") {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Aviso>{errorCarga}</Aviso>
          <Boton
            titulo="Reintentar"
            variante="secundario"
            onPress={() => setRecarga((n) => n + 1)}
          />
        </View>
      </View>
    );
  }

  const avatar = perfil?.urlAvatar
    ? resolverUrlMedia(perfil.urlAvatar, origenApi)
    : null;
  const iniciales = (perfil?.nombre ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
          Tu perfil
        </Text>

        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                backgroundColor: c.primarySelected,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  alt=""
                  style={{ width: 64, height: 64 }}
                />
              ) : (
                <Text
                  style={{
                    color: c.primaryStrong,
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  {iniciales || "?"}
                </Text>
              )}
            </View>
            <View style={{ gap: 8, flex: 1 }}>
              <Boton
                titulo={subiendoAvatar ? "Subiendo…" : "Cambiar foto"}
                variante="secundario"
                onPress={elegirAvatar}
                disabled={subiendoAvatar}
                style={{ minHeight: 36 }}
              />
              {perfil?.urlAvatar && (
                <Boton
                  titulo="Eliminar"
                  variante="secundario"
                  onPress={quitarAvatar}
                  disabled={subiendoAvatar}
                  style={{ minHeight: 36 }}
                />
              )}
            </View>
          </View>
          {errorAvatar && <Aviso>{errorAvatar}</Aviso>}
          {avisoAvatar && <Aviso tono="exito">{avisoAvatar}</Aviso>}

          <Campo
            etiqueta="Nombre"
            valor={nombre}
            onChangeText={setNombre}
            error={errorNombre}
          />
          <View style={{ gap: 6 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: "500" }}>
              Correo
            </Text>
            <View
              style={{
                minHeight: 46,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                justifyContent: "center",
                backgroundColor: c.surfaceHover,
              }}
            >
              <Text style={{ color: c.textSecondary }}>
                {perfil?.email ?? ""}
              </Text>
            </View>
          </View>
          {avisoNombre && <Aviso tono="exito">{avisoNombre}</Aviso>}
          <Boton
            titulo={guardando ? "Guardando…" : "Guardar cambios"}
            cargando={guardando}
            onPress={guardarNombre}
          />
        </View>

        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
            Contraseña
          </Text>
          <Campo
            etiqueta="Contraseña actual"
            valor={contrasena.actual}
            onChangeText={(valor) =>
              setContrasena((actual) => ({ ...actual, actual: valor }))
            }
            secureTextEntry
          />
          <Campo
            etiqueta="Nueva contraseña"
            valor={contrasena.nueva}
            onChangeText={(valor) =>
              setContrasena((actual) => ({ ...actual, nueva: valor }))
            }
            secureTextEntry
          />
          <Campo
            etiqueta="Repetir contraseña"
            valor={contrasena.repetir}
            onChangeText={(valor) =>
              setContrasena((actual) => ({ ...actual, repetir: valor }))
            }
            secureTextEntry
          />
          {errorContrasena && <Aviso>{errorContrasena}</Aviso>}
          {avisoContrasena && <Aviso tono="exito">{avisoContrasena}</Aviso>}
          <Boton
            titulo={cambiando ? "Cambiando…" : "Cambiar contraseña"}
            variante="secundario"
            cargando={cambiando}
            onPress={cambiarContrasena}
          />
        </View>

        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
            Cuenta
          </Text>
          <Boton
            titulo="Cerrar sesión"
            variante="secundario"
            onPress={async () => {
              await sesion.cerrarSesion();
              router.replace("/");
            }}
          />
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            Dar de baja tu cuenta la deshabilita y oculta tus anuncios.
          </Text>
          {errorBaja && <Aviso>{errorBaja}</Aviso>}
          {confirmandoBaja ? (
            <>
              <Text style={{ color: c.text, fontWeight: "600" }}>
                ¿Seguro que quieres dar de baja tu cuenta?
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Boton
                  titulo="Cancelar"
                  variante="secundario"
                  onPress={() => setConfirmandoBaja(false)}
                  style={{ flex: 1 }}
                />
                <Boton
                  titulo="Sí, dar de baja"
                  cargando={bajando}
                  onPress={darDeBaja}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmandoBaja(true)}
              style={{
                minHeight: 44,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: c.error,
                backgroundColor: c.errorSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.errorText, fontWeight: "600" }}>
                Dar de baja mi cuenta
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
