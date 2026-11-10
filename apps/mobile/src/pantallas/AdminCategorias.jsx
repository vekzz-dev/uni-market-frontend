import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { mapearProblema, puede } from "@uni-market/core";
import { Aviso, Boton, Cabecera, Campo, Estado } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

export function AdminCategorias() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";
  const puedeGestionar = puede(estado.usuario?.rol, "categorias.gestionar");

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [formulario, setFormulario] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [confirmando, setConfirmando] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) router.replace("/entrar");
  }, [autenticado, restaurado, router]);

  useEffect(() => {
    if (!autenticado || !puedeGestionar) return undefined;
    let vigente = true;
    setCargando(true);
    setError(null);

    sesion
      .ejecutar(() => cliente.categorias.listarCategorias())
      .then((respuesta) => {
        if (vigente) setCategorias(respuesta.datos ?? []);
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 401) router.replace("/entrar");
        else setError(problema.mensaje);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [autenticado, cliente, puedeGestionar, recarga, router, sesion]);

  async function guardar() {
    setErrorFormulario(null);
    setAviso(null);
    if (!formulario.nombre.trim()) {
      setErrorFormulario("Escribe el nombre de la categoría.");
      return;
    }
    const cuerpo = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      icono: formulario.icono.trim() || null,
    };
    setGuardando(true);
    try {
      if (formulario.id) {
        await sesion.ejecutar(() =>
          cliente.categorias.actualizarCategoria(formulario.id, cuerpo),
        );
        setAviso("Categoría actualizada.");
      } else {
        await sesion.ejecutar(() => cliente.categorias.crearCategoria(cuerpo));
        setAviso("Categoría creada.");
      }
      setFormulario(null);
      setRecarga((n) => n + 1);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else if (problema.status === 409)
        setErrorFormulario("Ya existe una categoría con ese nombre.");
      else setErrorFormulario(problema.mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(categoria) {
    setConfirmando(null);
    setAviso(null);
    try {
      await sesion.ejecutar(() =>
        cliente.categorias.eliminarCategoria(categoria.id),
      );
      setAviso("Categoría eliminada.");
      setRecarga((n) => n + 1);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setAviso(problema.mensaje);
    }
  }

  if (!restaurado || !autenticado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Inicia sesión para gestionar categorías
          </Text>
          <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
        </View>
      </View>
    );
  }

  if (!puedeGestionar) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            No tienes acceso a categorías
          </Text>
          <Boton
            titulo="Volver al catálogo"
            variante="secundario"
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
          Categorías
        </Text>

        {aviso && <Aviso tono="exito">{aviso}</Aviso>}

        {formulario ? (
          <View
            style={{
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.borderField,
              borderRadius: 12,
              padding: 14,
              gap: 10,
            }}
          >
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
              {formulario.id ? "Editar categoría" : "Nueva categoría"}
            </Text>
            <Campo
              etiqueta="Nombre"
              valor={formulario.nombre}
              onChangeText={(valor) =>
                setFormulario((actual) => ({ ...actual, nombre: valor }))
              }
              error={errorFormulario}
            />
            <Campo
              etiqueta="Descripción"
              valor={formulario.descripcion}
              onChangeText={(valor) =>
                setFormulario((actual) => ({ ...actual, descripcion: valor }))
              }
            />
            <Campo
              etiqueta="Icono"
              valor={formulario.icono}
              onChangeText={(valor) =>
                setFormulario((actual) => ({ ...actual, icono: valor }))
              }
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                onPress={() => setFormulario(null)}
                style={{ flex: 1 }}
              />
              <Boton
                titulo={guardando ? "Guardando…" : "Guardar categoría"}
                cargando={guardando}
                onPress={guardar}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <Boton
            titulo="Nueva categoría"
            onPress={() =>
              setFormulario({ nombre: "", descripcion: "", icono: "" })
            }
          />
        )}

        {cargando && <Estado>Cargando categorías…</Estado>}

        {!cargando && error && (
          <View style={{ gap: 8 }}>
            <Aviso>{error}</Aviso>
            <Boton
              titulo="Reintentar"
              variante="secundario"
              onPress={() => setRecarga((n) => n + 1)}
            />
          </View>
        )}

        {!cargando &&
          !error &&
          categorias.map((categoria) => (
            <View
              key={categoria.id}
              style={{
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                padding: 14,
                gap: 6,
              }}
            >
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "600" }}>
                {categoria.nombre}
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                {categoria.descripcion ?? "Sin descripción"} · orden{" "}
                {categoria.orden ?? "—"}
              </Text>
              {confirmando === categoria.id ? (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Boton
                    titulo="Cancelar"
                    variante="secundario"
                    onPress={() => setConfirmando(null)}
                    style={{ flex: 1, minHeight: 34 }}
                  />
                  <Boton
                    titulo="Sí, eliminar"
                    onPress={() => eliminar(categoria)}
                    style={{ flex: 1, minHeight: 34 }}
                  />
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Boton
                    titulo="Editar"
                    variante="secundario"
                    onPress={() =>
                      setFormulario({
                        id: categoria.id,
                        nombre: categoria.nombre ?? "",
                        descripcion: categoria.descripcion ?? "",
                        icono: categoria.icono ?? "",
                      })
                    }
                    style={{ flex: 1, minHeight: 34 }}
                  />
                  <Boton
                    titulo="Eliminar"
                    variante="secundario"
                    onPress={() => setConfirmando(categoria.id)}
                    style={{ flex: 1, minHeight: 34 }}
                  />
                </View>
              )}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}
