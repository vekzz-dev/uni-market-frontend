import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  mapearProblema,
  validarImagenes,
  validarPrecio,
} from "@uni-market/core";
import { Aviso, Boton, Campo, Cabecera } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

const MAX_IMAGENES = 5;

function aArchivo(asset) {
  return {
    uri: asset.uri,
    name: asset.fileName ?? `imagen-${Date.now()}.jpg`,
    type: asset.mimeType ?? "image/jpeg",
    size: asset.fileSize,
  };
}

export function Publicar() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [publicado, setPublicado] = useState(false);

  useEffect(() => {
    cliente.categorias
      .listarCategorias()
      .then((r) => setCategorias(r.datos ?? []))
      .catch(() => setCategorias([]));
  }, [cliente]);

  async function elegirImagenes() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setErrores((actuales) => ({
        ...actuales,
        imagenes: "Necesitamos acceso a tus fotos para publicar.",
      }));
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGENES,
      quality: 0.8,
    });
    if (resultado.canceled) return;
    setArchivos(resultado.assets.map(aArchivo).slice(0, MAX_IMAGENES));
    setErrores((actuales) => ({ ...actuales, imagenes: undefined }));
  }

  async function enviar() {
    setError(null);
    const problemas = {};
    if (!nombre.trim()) problemas.nombre = "Escribe un nombre.";
    const precioError = validarPrecio(precio);
    if (precioError) problemas.precio = precioError;
    if (archivos.length === 0) {
      problemas.imagenes = "Añade al menos una imagen.";
    } else {
      const imagenesError = validarImagenes(archivos);
      if (imagenesError) problemas.imagenes = imagenesError;
    }
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});

    setEnviando(true);
    try {
      await sesion.ejecutar(() =>
        cliente.anuncios.crearAnuncio(nombre.trim(), Number(precio), archivos, {
          descripcion: descripcion.trim() || undefined,
          categoriaId: categoriaId ?? undefined,
        }),
      );
      setPublicado(true);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setError(problema.mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (!restaurado || !autenticado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Inicia sesión para publicar
          </Text>
          <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
        </View>
      </View>
    );
  }

  if (publicado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: "600" }}>
            Anuncio publicado
          </Text>
          <Text style={{ color: c.textSecondary }}>
            Queda pendiente hasta que lo revise un moderador.
          </Text>
          <Boton
            titulo="Volver al catálogo"
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
                Publicar anuncio
              </Text>
              <Text style={{ color: c.textSecondary }}>
                Se revisará antes de aparecer en el catálogo.
              </Text>
            </View>

            {error && <Aviso>{error}</Aviso>}

            <Campo
              etiqueta="Nombre"
              valor={nombre}
              onChangeText={setNombre}
              error={errores.nombre}
            />
            <Campo
              etiqueta="Precio (USD)"
              valor={precio}
              onChangeText={setPrecio}
              keyboardType="decimal-pad"
              error={errores.precio}
            />
            <Campo
              etiqueta="Descripción"
              valor={descripcion}
              onChangeText={setDescripcion}
              multiline
            />

            {categorias.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text
                  style={{ color: c.text, fontSize: 14, fontWeight: "500" }}
                >
                  Categoría
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: categoriaId === null }}
                      onPress={() => setCategoriaId(null)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor:
                          categoriaId === null ? c.primary : c.border,
                        backgroundColor:
                          categoriaId === null ? c.primarySoft : c.surface,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            categoriaId === null ? c.primaryStrong : c.text,
                          fontWeight: "600",
                        }}
                      >
                        Sin categoría
                      </Text>
                    </Pressable>
                    {categorias.map((categoria) => (
                      <Pressable
                        key={categoria.id}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: categoriaId === categoria.id,
                        }}
                        onPress={() => setCategoriaId(categoria.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor:
                            categoriaId === categoria.id ? c.primary : c.border,
                          backgroundColor:
                            categoriaId === categoria.id
                              ? c.primarySoft
                              : c.surface,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              categoriaId === categoria.id
                                ? c.primaryStrong
                                : c.text,
                            fontWeight: "600",
                          }}
                        >
                          {categoria.nombre}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={{ gap: 8 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "500" }}>
                Imágenes
              </Text>
              {archivos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {archivos.map((archivo) => (
                      <Image
                        key={archivo.uri}
                        source={{ uri: archivo.uri }}
                        alt=""
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          backgroundColor: c.surfaceHover,
                        }}
                      />
                    ))}
                  </View>
                </ScrollView>
              )}
              <Boton
                titulo={
                  archivos.length > 0
                    ? `${archivos.length} imagen(es) · cambiar`
                    : "Añadir imágenes"
                }
                variante="secundario"
                onPress={elegirImagenes}
                disabled={enviando}
              />
              {errores.imagenes && <Aviso>{errores.imagenes}</Aviso>}
            </View>

            <Boton
              titulo={enviando ? "Publicando…" : "Publicar anuncio"}
              cargando={enviando}
              onPress={enviar}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
