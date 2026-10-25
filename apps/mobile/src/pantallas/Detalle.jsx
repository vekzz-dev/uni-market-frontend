import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  formatearFecha,
  formatearPrecio,
  mapearProblema,
  resolverUrlMedia,
} from "@uni-market/core";
import { Aviso, Boton, Cabecera } from "../componentes/ui.jsx";
import { origenApi } from "../config.js";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

export function Detalle() {
  const { id } = useLocalSearchParams();
  const { cliente, estado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();

  const [anuncio, setAnuncio] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [vista, setVista] = useState("cargando");
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const autenticado = estado.estado === "autenticado";

  useEffect(() => {
    let vigente = true;
    setVista("cargando");
    Promise.all([
      cliente.catalogo.leerAnuncio(id),
      cliente.categorias.listarCategorias().catch(() => ({ datos: [] })),
    ])
      .then(([detalle, categorias]) => {
        if (!vigente) return;
        setAnuncio(detalle);
        setCategoria(
          (categorias.datos ?? []).find(
            (cat) => String(cat.id) === String(detalle.categoriaId),
          ) ?? null,
        );
        setVista("listo");
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 404) setVista("no-disponible");
        else {
          setError(problema.mensaje);
          setVista("error");
        }
      });
    return () => {
      vigente = false;
    };
  }, [cliente, id, recarga]);

  async function reintentar() {
    setRecarga((n) => n + 1);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Cabecera>
        <Boton
          titulo="Catálogo"
          variante="secundario"
          onPress={() => router.push("/")}
          style={{ minHeight: 36 }}
        />
      </Cabecera>

      {vista === "cargando" && (
        <View style={{ padding: 32 }}>
          <ActivityIndicator color={c.primary} />
        </View>
      )}

      {vista === "no-disponible" && (
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Este anuncio ya no está disponible
          </Text>
          <Text style={{ color: c.textSecondary }}>
            Puede que se haya vendido o que ya no esté publicado.
          </Text>
          <Boton titulo="Volver al catálogo" onPress={() => router.push("/")} />
        </View>
      )}

      {vista === "error" && (
        <View style={{ padding: 24, gap: 12 }}>
          <Aviso>{error}</Aviso>
          <Boton titulo="Reintentar" onPress={reintentar} />
          <Boton
            titulo="Volver al catálogo"
            variante="secundario"
            onPress={() => router.push("/")}
          />
        </View>
      )}

      {vista === "listo" && anuncio && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {anuncio.imagenUrls?.[0] ? (
            <Image
              source={{
                uri: resolverUrlMedia(anuncio.imagenUrls[0], origenApi),
              }}
              style={{ width: "100%", aspectRatio: 16 / 10, borderRadius: 12 }}
            />
          ) : (
            <View
              style={{
                width: "100%",
                aspectRatio: 16 / 10,
                borderRadius: 12,
                backgroundColor: c.surfaceHover,
              }}
            />
          )}

          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: c.primaryStrong,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {categoria?.nombre ?? "Sin categoría"}
            </Text>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
              {anuncio.nombre}
            </Text>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
              {formatearPrecio(anuncio.precio)}
            </Text>
            {anuncio.vendedorNombre && (
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "500" }}>
                Vendedor: {anuncio.vendedorNombre}
              </Text>
            )}
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              Publicado el {formatearFecha(anuncio.fechaCreacion)}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: c.border }} />

          {anuncio.descripcion && (
            <Text
              style={{ color: c.textSecondary, fontSize: 15, lineHeight: 24 }}
            >
              {anuncio.descripcion}
            </Text>
          )}

          <View
            style={{
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              padding: 16,
              gap: 8,
              backgroundColor: c.surface,
            }}
          >
            <Text style={{ color: c.text, fontSize: 15, fontWeight: "600" }}>
              ¿Te interesa?
            </Text>
            {autenticado ? (
              <Text style={{ color: c.textSecondary }}>
                La mensajería estará disponible en la siguiente entrega.
              </Text>
            ) : (
              <>
                <Text style={{ color: c.textSecondary }}>
                  Inicia sesión para contactar al vendedor.
                </Text>
                <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
