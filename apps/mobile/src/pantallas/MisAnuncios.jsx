import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  formatearFechaRelativa,
  formatearPrecio,
  mapearProblema,
} from "@uni-market/core";
import { Aviso, Boton, Cabecera, Estado } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

const LIMITE = 10;

function estadoVisible(anuncio) {
  if (anuncio.estado === "vendido") return { texto: "Vendido", tono: "neutro" };
  if (anuncio.estadoRevision === "pendiente")
    return { texto: "Pendiente", tono: "advertencia" };
  if (anuncio.estadoRevision === "rechazado")
    return anuncio.retraido
      ? { texto: "Retraído", tono: "error" }
      : { texto: "Rechazado", tono: "error" };
  if (anuncio.estado === "inactivo")
    return { texto: "Inactivo", tono: "neutro" };
  if (anuncio.estadoRevision === "aprobado")
    return { texto: "Aprobado", tono: "exito" };
  return { texto: anuncio.estadoRevision ?? "—", tono: "neutro" };
}

const TONOS = {
  advertencia: ["warningSoft", "warningText"],
  exito: ["successSoft", "successText"],
  error: ["errorSoft", "errorText"],
  neutro: ["surfaceHover", "textSecondary"],
};

export function MisAnuncios() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";

  const [pagina, setPagina] = useState(0);
  const [anuncios, setAnuncios] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [confirmando, setConfirmando] = useState(null);
  const [accionando, setAccionando] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) router.replace("/entrar");
  }, [autenticado, restaurado, router]);

  useFocusEffect(
    useCallback(() => {
      setRecarga((n) => n + 1);
    }, []),
  );

  useEffect(() => {
    if (!autenticado) return undefined;
    let vigente = true;
    setCargando(true);
    setError(null);

    sesion
      .ejecutar(() =>
        cliente.anuncios.listarMisAnuncios({ pagina, limite: LIMITE }),
      )
      .then((respuesta) => {
        if (!vigente) return;
        const datos = respuesta.datos ?? [];
        if (datos.length === 0 && pagina > 0) {
          setPagina((actual) => Math.max(0, actual - 1));
          return;
        }
        setAnuncios(datos);
        setPaginacion(respuesta.paginacion ?? null);
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
  }, [autenticado, cliente, pagina, recarga, sesion, router]);

  async function accion(anuncio, operacion) {
    setAccionando(anuncio.id);
    setErrorAccion(null);
    try {
      await sesion.ejecutar(operacion);
      setConfirmando(null);
      setRecarga((n) => n + 1);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorAccion(problema.mensaje);
    } finally {
      setAccionando(null);
    }
  }

  if (!restaurado || !autenticado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Inicia sesión para ver tus anuncios
          </Text>
          <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera>
        <Boton
          titulo="Publicar"
          variante="secundario"
          onPress={() => router.push("/publicar")}
          style={{ minHeight: 34 }}
        />
      </Cabecera>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
          Mis anuncios
        </Text>
        <Text style={{ color: c.textSecondary }}>
          Revisa el estado de cada publicación y gestiónala.
        </Text>

        {errorAccion && <Aviso>{errorAccion}</Aviso>}

        {cargando && <Estado>Cargando tus anuncios…</Estado>}

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

        {!cargando && !error && anuncios.length === 0 && (
          <View style={{ gap: 8, alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
              Aún no publicaste nada
            </Text>
            <Text style={{ color: c.textSecondary, textAlign: "center" }}>
              Publica tu primer anuncio; quedará pendiente hasta que lo revise
              un moderador.
            </Text>
            <Boton
              titulo="Publicar anuncio"
              onPress={() => router.push("/publicar")}
            />
          </View>
        )}

        {!cargando &&
          !error &&
          anuncios.map((anuncio) => {
            const badge = estadoVisible(anuncio);
            const [fondo, tinta] = TONOS[badge.tono] ?? TONOS.neutro;
            const disponible = anuncio.estado === "disponible";
            const aprobado = anuncio.estadoRevision === "aprobado";
            const ocupado = accionando === anuncio.id;
            return (
              <View
                key={anuncio.id}
                style={{
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 12,
                  padding: 14,
                  gap: 10,
                }}
              >
                <View style={{ gap: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: c.text,
                        fontSize: 16,
                        fontWeight: "600",
                        flex: 1,
                      }}
                    >
                      {anuncio.nombre}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: c[fondo],
                      }}
                    >
                      <Text
                        style={{
                          color: c[tinta],
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {badge.texto}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: c.text, fontWeight: "600" }}>
                    {formatearPrecio(anuncio.precio)}
                  </Text>
                  {anuncio.estadoRevision === "rechazado" &&
                  anuncio.motivoRechazo ? (
                    <Text style={{ color: c.errorText, fontSize: 13 }}>
                      {anuncio.motivoRechazo}
                    </Text>
                  ) : (
                    <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                      {anuncio.estado === "vendido"
                        ? "Marcado como vendido"
                        : anuncio.estadoRevision === "pendiente"
                          ? "En revisión"
                          : disponible
                            ? "Visible en el catálogo"
                            : "No visible en el catálogo"}
                      {anuncio.fechaActualizacion
                        ? ` · ${formatearFechaRelativa(anuncio.fechaActualizacion)}`
                        : ""}
                    </Text>
                  )}
                </View>

                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  <Boton
                    titulo="Editar"
                    variante="secundario"
                    onPress={() =>
                      router.push(`/mis-anuncios/${anuncio.id}/editar`)
                    }
                    disabled={ocupado}
                    style={{ flexBasis: 140, flexGrow: 1, minHeight: 36 }}
                  />
                  {aprobado && anuncio.estado !== "vendido" && (
                    <Boton
                      titulo={disponible ? "Ocultar" : "Mostrar"}
                      variante="secundario"
                      onPress={() =>
                        accion(anuncio, () =>
                          cliente.anuncios.alternarVisibilidad(anuncio.id, {
                            visible: !disponible,
                          }),
                        )
                      }
                      disabled={ocupado}
                      style={{ flexBasis: 140, flexGrow: 1, minHeight: 36 }}
                    />
                  )}
                  {aprobado && disponible && (
                    <Boton
                      titulo="Vendido"
                      variante="secundario"
                      onPress={() =>
                        accion(anuncio, () =>
                          cliente.anuncios.marcarVendido(anuncio.id),
                        )
                      }
                      disabled={ocupado}
                      style={{ flexBasis: 140, flexGrow: 1, minHeight: 36 }}
                    />
                  )}
                  <Boton
                    titulo="Eliminar"
                    variante="secundario"
                    onPress={() => setConfirmando(anuncio.id)}
                    disabled={ocupado}
                    style={{ flexBasis: 140, flexGrow: 1, minHeight: 36 }}
                  />
                </View>

                {confirmando === anuncio.id && (
                  <View
                    style={{
                      gap: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: c.border,
                    }}
                  >
                    <Text style={{ color: c.text, fontWeight: "600" }}>
                      ¿Dar de baja este anuncio?
                    </Text>
                    <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                      No se puede deshacer.
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Boton
                        titulo="Cancelar"
                        variante="secundario"
                        onPress={() => setConfirmando(null)}
                        style={{ flex: 1, minHeight: 36 }}
                      />
                      <Boton
                        titulo="Sí, dar de baja"
                        onPress={() =>
                          accion(anuncio, () =>
                            cliente.anuncios.darDeBajaAnuncio(anuncio.id),
                          )
                        }
                        cargando={ocupado}
                        style={{ flex: 1, minHeight: 36 }}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}

        {!cargando && paginacion && paginacion.totalPaginas > 1 && (
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Boton
              titulo="Anterior"
              variante="secundario"
              onPress={() => setPagina((n) => Math.max(0, n - 1))}
              disabled={pagina === 0}
              style={{ flex: 1, minHeight: 36 }}
            />
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              {pagina + 1} / {paginacion.totalPaginas}
            </Text>
            <Boton
              titulo="Siguiente"
              variante="secundario"
              onPress={() => setPagina((n) => n + 1)}
              disabled={pagina + 1 >= paginacion.totalPaginas}
              style={{ flex: 1, minHeight: 36 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
