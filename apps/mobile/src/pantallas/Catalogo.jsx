import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  formatearFechaRelativa,
  formatearPrecio,
  fusionarPagina,
  mapearProblema,
  resolverUrlMedia,
} from "@uni-market/core";
import { Aviso, Boton, Cabecera, Estado } from "../componentes/ui.jsx";
import { origenApi } from "../config.js";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

const LIMITE = 12;

export function Catalogo() {
  const { cliente, sesion, estado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();

  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({
    q: "",
    categoriaId: "",
    orden: "fechaCreacion",
  });
  const [busqueda, setBusqueda] = useState("");
  const [anuncios, setAnuncios] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [errorMas, setErrorMas] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const solicitud = useRef(0);
  const autenticado = estado.estado === "autenticado";

  useEffect(() => {
    cliente.categorias
      .listarCategorias()
      .then((r) => setCategorias(r.datos ?? []))
      .catch(() => setCategorias([]));
  }, [cliente]);

  useEffect(() => {
    const id = ++solicitud.current;
    setCargando(true);
    setError(null);

    const parametros = { orden: filtros.orden, limite: LIMITE };
    if (filtros.q) parametros.q = filtros.q;
    if (filtros.categoriaId)
      parametros.categoriaId = Number(filtros.categoriaId);

    cliente.catalogo
      .buscarCatalogo(parametros)
      .then((pagina) => {
        if (solicitud.current !== id) return;
        setAnuncios(pagina.datos ?? []);
        setCursor(pagina.paginacion?.cursorSiguiente ?? null);
      })
      .catch((fallo) => {
        if (solicitud.current !== id) return;
        setError(mapearProblema(fallo).mensaje);
      })
      .finally(() => {
        if (solicitud.current === id) setCargando(false);
      });
  }, [cliente, filtros, recarga]);

  async function cargarMas() {
    if (!cursor || cargandoMas || cargando) return;
    const id = ++solicitud.current;
    setCargandoMas(true);
    setErrorMas(null);

    const parametros = { orden: filtros.orden, limite: LIMITE, cursor };
    if (filtros.q) parametros.q = filtros.q;
    if (filtros.categoriaId)
      parametros.categoriaId = Number(filtros.categoriaId);

    try {
      const pagina = await cliente.catalogo.buscarCatalogo(parametros);
      if (solicitud.current !== id) return;
      setAnuncios((vigentes) => fusionarPagina(vigentes, pagina.datos ?? []));
      setCursor(pagina.paginacion?.cursorSiguiente ?? null);
    } catch (fallo) {
      if (solicitud.current === id) setErrorMas(mapearProblema(fallo).mensaje);
    } finally {
      setCargandoMas(false);
    }
  }

  const porId = new Map(categorias.map((cat) => [String(cat.id), cat]));
  const hayFiltros = Boolean(
    filtros.q || filtros.categoriaId || filtros.orden !== "fechaCreacion",
  );

  function limpiar() {
    setBusqueda("");
    setFiltros({ q: "", categoriaId: "", orden: "fechaCreacion" });
  }

  const encabezado = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Text style={{ color: c.text, fontSize: 24, fontWeight: "700" }}>
        Anuncios disponibles
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 13 }}>
        Todos los anuncios pasan por revisión antes de publicarse.
      </Text>
      <View
        style={[
          estilos.buscador,
          { backgroundColor: c.surfaceHover, borderColor: c.borderField },
        ]}
      >
        <TextInput
          accessibilityLabel="Buscar en el catálogo"
          placeholder="Buscar en el catálogo"
          placeholderTextColor={c.textSecondary}
          value={busqueda}
          onChangeText={setBusqueda}
          onSubmitEditing={() =>
            setFiltros((f) => ({ ...f, q: busqueda.trim() }))
          }
          style={[estilos.entrada, { color: c.text }]}
        />
        <Boton
          titulo="Buscar"
          onPress={() => setFiltros((f) => ({ ...f, q: busqueda.trim() }))}
          style={{ minHeight: 36 }}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        <Chip
          activo={filtros.categoriaId === ""}
          titulo="Todas"
          onPress={() => setFiltros((f) => ({ ...f, categoriaId: "" }))}
        />
        {categorias.map((cat) => (
          <Chip
            key={cat.id}
            activo={filtros.categoriaId === String(cat.id)}
            titulo={cat.nombre}
            onPress={() =>
              setFiltros((f) => ({ ...f, categoriaId: String(cat.id) }))
            }
          />
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip
          activo={filtros.orden === "fechaCreacion"}
          titulo="Recientes"
          onPress={() => setFiltros((f) => ({ ...f, orden: "fechaCreacion" }))}
        />
        <Chip
          activo={filtros.orden === "precio"}
          titulo="Menor precio"
          onPress={() => setFiltros((f) => ({ ...f, orden: "precio" }))}
        />
      </View>
      {cargando && <Estado>Cargando anuncios…</Estado>}
      {error && (
        <View style={{ gap: 8 }}>
          <Aviso>{error}</Aviso>
          <Boton
            titulo="Reintentar"
            variante="secundario"
            onPress={() => setRecarga((n) => n + 1)}
          />
        </View>
      )}
      {!cargando && !error && anuncios.length === 0 && (
        <View style={{ gap: 8, alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
            No encontramos anuncios
          </Text>
          <Text style={{ color: c.textSecondary, textAlign: "center" }}>
            {hayFiltros
              ? "Prueba con otra categoría o cambia la búsqueda."
              : "Cuando alguien publique algo, aparecerá aquí."}
          </Text>
          {hayFiltros && (
            <Boton
              titulo="Limpiar filtros"
              variante="secundario"
              onPress={limpiar}
            />
          )}
        </View>
      )}
    </View>
  );

  async function salir() {
    await sesion.cerrarSesion();
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Cabecera>
        <Boton
          titulo={autenticado ? "Salir" : "Entrar"}
          variante="secundario"
          onPress={autenticado ? salir : () => router.push("/entrar")}
          style={{ minHeight: 34 }}
        />
      </Cabecera>
      <FlatList
        data={anuncios}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={encabezado}
        renderItem={({ item }) => (
          <TarjetaAnuncio
            anuncio={item}
            categoria={porId.get(String(item.categoriaId))}
            onPress={() => router.push(`/anuncios/${item.id}`)}
          />
        )}
        ListFooterComponent={
          <View style={{ gap: 8, paddingTop: 8 }}>
            {errorMas && <Aviso>{errorMas}</Aviso>}
            {cursor && (
              <Boton
                titulo={cargandoMas ? "Cargando…" : "Cargar más anuncios"}
                variante="secundario"
                cargando={cargandoMas}
                disabled={cargando}
                onPress={cargarMas}
              />
            )}
          </View>
        }
      />
    </View>
  );
}

function Chip({ activo, titulo, onPress }) {
  const { semantic: c } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={{
        minHeight: 36,
        paddingHorizontal: 14,
        justifyContent: "center",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: activo ? c.primarySelected : c.borderField,
        backgroundColor: activo ? c.primarySelected : c.surface,
      }}
    >
      <Text
        style={{
          color: activo ? c.primaryStrong : c.text,
          fontWeight: activo ? "600" : "400",
        }}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

function TarjetaAnuncio({ anuncio, categoria, onPress }) {
  const { semantic: c } = useTema();
  const imagen = anuncio.imagenUrls?.[0];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        estilos.tarjeta,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {imagen ? (
        <Image
          source={{ uri: resolverUrlMedia(imagen, origenApi) }}
          style={estilos.imagen}
        />
      ) : (
        <View style={[estilos.imagen, { backgroundColor: c.surfaceHover }]} />
      )}
      <View style={{ flex: 1, gap: 4, padding: 12 }}>
        <Text
          numberOfLines={2}
          style={{ color: c.text, fontSize: 15, fontWeight: "600" }}
        >
          {anuncio.nombre}
        </Text>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
          {formatearPrecio(anuncio.precio)}
        </Text>
        <Text
          style={{ color: c.textSecondary, fontSize: 12 }}
          numberOfLines={1}
        >
          {categoria?.nombre ?? "Sin categoría"}
          {anuncio.vendedorNombre ? ` · ${anuncio.vendedorNombre}` : ""} ·{" "}
          {formatearFechaRelativa(anuncio.fechaCreacion)}
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagen: { width: 104, height: 104 },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 4,
  },
  entrada: { flex: 1, minHeight: 44 },
});
