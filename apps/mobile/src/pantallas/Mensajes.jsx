import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { formatearFechaRelativa, mapearProblema } from "@uni-market/core";
import { Aviso, Boton, Cabecera, Estado } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

const LIMITE = 10;

export function Mensajes() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";

  const [pagina, setPagina] = useState(0);
  const [conversaciones, setConversaciones] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);

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
        cliente.conversaciones.listarMisConversaciones({
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
        setConversaciones(datos);
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

  if (!restaurado || !autenticado) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            Inicia sesión para ver tus mensajes
          </Text>
          <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "600" }}>
          Mensajes
        </Text>
        <Text style={{ color: c.textSecondary }}>
          Tus conversaciones de compra y venta.
        </Text>

        {cargando && <Estado>Cargando tus conversaciones…</Estado>}

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

        {!cargando && !error && conversaciones.length === 0 && (
          <View style={{ gap: 8, alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "600" }}>
              Aún no tienes conversaciones
            </Text>
            <Text style={{ color: c.textSecondary, textAlign: "center" }}>
              Cuando contactes a un vendedor o alguien te escriba, aparecerá
              aquí.
            </Text>
            <Boton
              titulo="Explorar catálogo"
              onPress={() => router.push("/")}
            />
          </View>
        )}

        {!cargando &&
          !error &&
          conversaciones.map((conversacion) => {
            const noLeidos = conversacion.noLeidos ?? 0;
            const otro = conversacion.contraparteNombre ?? "Usuario";
            return (
              <View
                key={conversacion.id}
                style={{
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 12,
                  padding: 14,
                  gap: 6,
                }}
              >
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
                    {conversacion.anuncio?.nombre ?? "Conversación"}
                  </Text>
                  {noLeidos > 0 && (
                    <View
                      accessibilityLabel={`${noLeidos} sin leer`}
                      style={{
                        minWidth: 20,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: c.primary,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: c.textOnPrimary,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {noLeidos}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: c.text }} numberOfLines={1}>
                  {conversacion.ultimoMensaje?.texto ?? "Sin mensajes todavía"}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  Con {otro} ·{" "}
                  {formatearFechaRelativa(conversacion.fechaActualizacion)}
                </Text>
                <Boton
                  titulo="Abrir"
                  variante="secundario"
                  onPress={() => router.push(`/mensajes/${conversacion.id}`)}
                  style={{ minHeight: 36 }}
                />
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
