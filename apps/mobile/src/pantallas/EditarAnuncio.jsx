import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { mapearProblema, validarPrecio } from "@uni-market/core";
import { Aviso, Boton, Cabecera, Campo, Estado } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

export function EditarAnuncio() {
  const { id } = useLocalSearchParams();
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";

  const [vista, setVista] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (restaurado && !autenticado) router.replace("/entrar");
  }, [autenticado, restaurado, router]);

  useEffect(() => {
    cliente.categorias
      .listarCategorias()
      .then((r) => setCategorias(r.datos ?? []))
      .catch(() => setCategorias([]));
  }, [cliente]);

  useEffect(() => {
    if (!autenticado) return undefined;
    let vigente = true;
    setVista("cargando");
    setErrorCarga(null);

    sesion
      .ejecutar(() => cliente.anuncios.leerMiAnuncio(id))
      .then((anuncio) => {
        if (!vigente) return;
        setNombre(anuncio.nombre ?? "");
        setPrecio(anuncio.precio != null ? String(anuncio.precio) : "");
        setDescripcion(anuncio.descripcion ?? "");
        setCategoriaId(anuncio.categoriaId ?? null);
        setVista("listo");
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 401) router.replace("/entrar");
        else if (problema.status === 404) setVista("no-encontrado");
        else {
          setErrorCarga(problema.mensaje);
          setVista("error");
        }
      });

    return () => {
      vigente = false;
    };
  }, [autenticado, cliente, id, recarga, sesion, router]);

  async function guardar() {
    setError(null);
    const problemas = {};
    if (!nombre.trim()) problemas.nombre = "Escribe un nombre.";
    const precioError = validarPrecio(precio);
    if (precioError) problemas.precio = precioError;
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});

    setGuardando(true);
    try {
      await sesion.ejecutar(() =>
        cliente.anuncios.editarAnuncio(id, {
          nombre: nombre.trim(),
          precio: Number(precio),
          descripcion: descripcion.trim() || undefined,
          categoriaId: categoriaId ?? null,
        }),
      );
      setGuardado(true);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setError(problema.mensaje);
    } finally {
      setGuardando(false);
    }
  }

  if (!restaurado || !autenticado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Inicia sesión para editar
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
        <Estado>Cargando el anuncio…</Estado>
      </View>
    );
  }

  if (vista === "no-encontrado") {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: "600" }}>
            No encontramos ese anuncio
          </Text>
          <Text style={{ color: c.textSecondary }}>
            Puede que ya no exista o que no sea tuyo.
          </Text>
          <Boton
            titulo="Ir a mis anuncios"
            onPress={() => router.replace("/mis-anuncios")}
          />
        </View>
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

  if (guardado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: "600" }}>
            Anuncio actualizado
          </Text>
          <Text style={{ color: c.textSecondary }}>
            Los cambios vuelven a revisión.
          </Text>
          <Boton
            titulo="Volver a mis anuncios"
            onPress={() => router.replace("/mis-anuncios")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
          Editar anuncio
        </Text>
        <Text style={{ color: c.textSecondary }}>
          Al guardar, el anuncio vuelve a revisión.
        </Text>

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
            <Text style={{ color: c.text, fontSize: 14, fontWeight: "500" }}>
              Categoría
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Boton
                  titulo="Sin categoría"
                  variante={categoriaId === null ? "primario" : "secundario"}
                  onPress={() => setCategoriaId(null)}
                  style={{ minHeight: 36 }}
                />
                {categorias.map((categoria) => (
                  <Boton
                    key={categoria.id}
                    titulo={categoria.nombre}
                    variante={
                      categoriaId === categoria.id ? "primario" : "secundario"
                    }
                    onPress={() => setCategoriaId(categoria.id)}
                    style={{ minHeight: 36 }}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <Boton
          titulo={guardando ? "Guardando…" : "Guardar cambios"}
          cargando={guardando}
          onPress={guardar}
        />
      </ScrollView>
    </View>
  );
}
