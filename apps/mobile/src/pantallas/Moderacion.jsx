import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  formatearFecha,
  formatearPrecio,
  mapearProblema,
  puede,
  validarMotivo,
} from "@uni-market/core";
import { Aviso, Boton, Cabecera, Estado } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

const LIMITE = 10;

const FILTROS = [
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "aprobado", etiqueta: "Aprobados" },
  { valor: "rechazado", etiqueta: "Rechazados" },
];

export function Moderacion() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";
  const esModerador = puede(estado.usuario?.rol, "moderacion.decidir");

  const [filtro, setFiltro] = useState("pendiente");
  const [pagina, setPagina] = useState(0);
  const [anuncios, setAnuncios] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [decidiendo, setDecidiendo] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorDecision, setErrorDecision] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) router.replace("/entrar");
  }, [autenticado, restaurado, router]);

  useEffect(() => {
    if (!autenticado || !esModerador) return undefined;
    let vigente = true;
    setCargando(true);
    setError(null);

    sesion
      .ejecutar(() =>
        cliente.moderacion.listarColaModeracion({
          estadoRevision: filtro,
          pagina,
          limite: LIMITE,
        }),
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
  }, [
    autenticado,
    cliente,
    esModerador,
    filtro,
    pagina,
    recarga,
    sesion,
    router,
  ]);

  function filtrar(valor) {
    setFiltro(valor);
    setPagina(0);
    setDecidiendo(null);
    setAviso(null);
    setErrorDecision(null);
  }

  async function decidir(anuncio, decision, textoMotivo) {
    if (decision !== "aprobar") {
      const problema = validarMotivo(textoMotivo);
      if (problema) {
        setErrorDecision(problema);
        return;
      }
    }
    setEnviando(true);
    setErrorDecision(null);
    try {
      await sesion.ejecutar(() =>
        cliente.moderacion.decidirRevision(anuncio.id, {
          decision,
          ...(decision === "aprobar"
            ? {}
            : { motivoRechazo: textoMotivo.trim() }),
        }),
      );
      const etiqueta =
        decision === "aprobar"
          ? "aprobado"
          : decision === "rechazar"
            ? "rechazado"
            : "retraído";
      setAviso(`Anuncio ${etiqueta}.`);
      setDecidiendo(null);
      setMotivo("");
      setRecarga((n) => n + 1);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorDecision(problema.mensaje);
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
            Inicia sesión para moderar
          </Text>
          <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
        </View>
      </View>
    );
  }

  if (!esModerador) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            No tienes acceso a moderación
          </Text>
          <Text style={{ color: c.textSecondary }}>
            Esta sección es para moderadores.
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
          Moderación
        </Text>
        <Text style={{ color: c.textSecondary }}>
          Pendientes, del más antiguo al más nuevo.
        </Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTROS.map(({ valor, etiqueta }) => (
            <Boton
              key={valor}
              titulo={etiqueta}
              variante={filtro === valor ? "primario" : "secundario"}
              onPress={() => filtrar(valor)}
              style={{ flex: 1, minHeight: 34 }}
            />
          ))}
        </View>

        {aviso && <Aviso tono="exito">{aviso}</Aviso>}

        {cargando && <Estado>Cargando la cola…</Estado>}

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
          <View style={{ gap: 6, alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
              {filtro === "pendiente"
                ? "No hay anuncios pendientes"
                : "No hay anuncios en este estado"}
            </Text>
          </View>
        )}

        {!cargando &&
          !error &&
          anuncios.map((anuncio) => {
            const abierto = decidiendo?.id === anuncio.id;
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
                <Text
                  style={{ color: c.text, fontSize: 16, fontWeight: "600" }}
                >
                  {anuncio.nombre}
                </Text>
                <Text style={{ color: c.text }}>
                  {formatearPrecio(anuncio.precio)}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  Vendedor: {anuncio.vendedorNombre ?? "—"} ·{" "}
                  {formatearFecha(anuncio.fechaCreacion)}
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {filtro === "pendiente" && (
                    <>
                      <Boton
                        titulo="Aprobar"
                        onPress={() => decidir(anuncio, "aprobar", "")}
                        disabled={enviando}
                        style={{ flex: 1, minHeight: 36 }}
                      />
                      <Boton
                        titulo="Rechazar"
                        variante="secundario"
                        onPress={() => {
                          setDecidiendo({ ...anuncio, decision: "rechazar" });
                          setMotivo("");
                          setErrorDecision(null);
                        }}
                        disabled={enviando}
                        style={{ flex: 1, minHeight: 36 }}
                      />
                    </>
                  )}
                  {filtro === "aprobado" && (
                    <Boton
                      titulo="Retraer"
                      variante="secundario"
                      onPress={() => {
                        setDecidiendo({ ...anuncio, decision: "retraer" });
                        setMotivo("");
                        setErrorDecision(null);
                      }}
                      disabled={enviando}
                      style={{ flex: 1, minHeight: 36 }}
                    />
                  )}
                </View>

                {abierto && (
                  <View
                    style={{
                      gap: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: c.border,
                    }}
                  >
                    <Text style={{ color: c.text, fontWeight: "600" }}>
                      Motivo
                    </Text>
                    <TextInput
                      accessibilityLabel="Motivo"
                      value={motivo}
                      onChangeText={setMotivo}
                      placeholder="Explica qué debe corregir el vendedor…"
                      placeholderTextColor={c.textSecondary}
                      multiline
                      style={{
                        minHeight: 72,
                        borderWidth: 1,
                        borderColor: c.borderField,
                        borderRadius: 8,
                        padding: 10,
                        color: c.text,
                        backgroundColor: c.surface,
                        textAlignVertical: "top",
                      }}
                    />
                    {errorDecision && <Aviso>{errorDecision}</Aviso>}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Boton
                        titulo="Cancelar"
                        variante="secundario"
                        onPress={() => setDecidiendo(null)}
                        style={{ flex: 1, minHeight: 36 }}
                      />
                      <Boton
                        titulo={`Confirmar ${decidiendo.decision}`}
                        cargando={enviando}
                        onPress={() =>
                          decidir(decidiendo, decidiendo.decision, motivo)
                        }
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
