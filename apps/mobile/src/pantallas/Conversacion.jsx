import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { formatearFechaRelativa, mapearProblema } from "@uni-market/core";
import { Aviso, Boton, Cabecera, Estado } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

const LIMITE = 30;

export function Conversacion() {
  const { id } = useLocalSearchParams();
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";
  const usuarioId = estado.usuario?.id;

  const [conversacion, setConversacion] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [vista, setVista] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
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
    setVista("cargando");
    setErrorCarga(null);

    Promise.all([
      sesion.ejecutar(() => cliente.conversaciones.leerConversacion(id)),
      sesion.ejecutar(() =>
        cliente.mensajes.listarMensajes(id, { limite: LIMITE }),
      ),
    ])
      .then(([detalle, pagina]) => {
        if (!vigente) return;
        setConversacion(detalle);
        setMensajes([...(pagina.datos ?? [])].reverse());
        setCursor(pagina.paginacion?.cursorSiguiente ?? null);
        setVista("listo");
        if ((detalle?.noLeidos ?? 0) > 0) {
          sesion
            .ejecutar(() => cliente.mensajes.marcarLecturas(id))
            .catch(() => {});
        }
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 401) router.replace("/entrar");
        else if (problema.status === 403 || problema.status === 404)
          setVista("no-encontrada");
        else {
          setErrorCarga(problema.mensaje);
          setVista("error");
        }
      });

    return () => {
      vigente = false;
    };
  }, [autenticado, cliente, id, recarga, sesion, router]);

  async function cargarAnteriores() {
    if (!cursor || cargandoAnteriores) return;
    setCargandoAnteriores(true);
    setErrorEnvio(null);
    try {
      const pagina = await sesion.ejecutar(() =>
        cliente.mensajes.listarMensajes(id, { cursor, limite: LIMITE }),
      );
      setMensajes((vigentes) => [
        ...(pagina.datos ?? []).slice().reverse(),
        ...vigentes,
      ]);
      setCursor(pagina.paginacion?.cursorSiguiente ?? null);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorEnvio(problema.mensaje);
    } finally {
      setCargandoAnteriores(false);
    }
  }

  async function enviar() {
    const limpio = texto.trim();
    if (!limpio) {
      setErrorEnvio("Escribe un mensaje.");
      return;
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const creado = await sesion.ejecutar(() =>
        cliente.mensajes.enviarMensaje(id, { texto: limpio }),
      );
      setMensajes((vigentes) => [...vigentes, creado]);
      setTexto("");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else setErrorEnvio(problema.mensaje);
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
            Inicia sesión para ver la conversación
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
        <Estado>Cargando la conversación…</Estado>
      </View>
    );
  }

  if (vista === "no-encontrada") {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: "600" }}>
            No encontramos esa conversación
          </Text>
          <Text style={{ color: c.textSecondary }}>
            Puede que ya no exista o que no participes en ella.
          </Text>
          <Boton
            titulo="Ir a mis mensajes"
            onPress={() => router.replace("/mensajes")}
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

  const anuncio = conversacion?.anuncio ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
      <Cabecera />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View
          style={{
            margin: 16,
            flex: 1,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
          }}
        >
          <View
            style={{
              padding: 14,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
              gap: 2,
            }}
          >
            <Text style={{ color: c.text, fontSize: 16, fontWeight: "600" }}>
              {anuncio?.nombre ?? "Conversación"}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              {conversacion?.contraparteNombre
                ? `Con ${conversacion.contraparteNombre}`
                : ""}
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
            {cursor && (
              <Boton
                titulo="Cargar anteriores"
                variante="secundario"
                cargando={cargandoAnteriores}
                onPress={cargarAnteriores}
                style={{ minHeight: 34 }}
              />
            )}

            {mensajes.length === 0 && (
              <View
                style={{ gap: 6, paddingVertical: 24, alignItems: "center" }}
              >
                <Text style={{ color: c.text, fontWeight: "600" }}>
                  Aún no hay mensajes
                </Text>
                <Text style={{ color: c.textSecondary, textAlign: "center" }}>
                  Escribe el primero para empezar la conversación.
                </Text>
              </View>
            )}

            {mensajes.map((mensaje) => {
              const propio = mensaje.remitenteId === usuarioId;
              return (
                <View
                  key={mensaje.id}
                  style={{
                    alignSelf: propio ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    backgroundColor: propio
                      ? c.primarySelected
                      : c.surfaceHover,
                    borderRadius: 12,
                    padding: 10,
                    gap: 2,
                  }}
                >
                  <Text style={{ color: c.text }}>{mensaje.texto}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>
                    {formatearFechaRelativa(mensaje.fechaCreacion)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              padding: 12,
              borderTopWidth: 1,
              borderTopColor: c.border,
            }}
          >
            <TextInput
              accessibilityLabel="Mensaje"
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={c.textSecondary}
              style={{
                flex: 1,
                minHeight: 42,
                borderWidth: 1,
                borderColor: c.borderField,
                borderRadius: 8,
                paddingHorizontal: 12,
                color: c.text,
                backgroundColor: c.surface,
              }}
            />
            <Boton
              titulo="Enviar"
              cargando={enviando}
              onPress={enviar}
              style={{ minHeight: 42, paddingHorizontal: 14 }}
            />
          </View>
          {errorEnvio && (
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <Aviso>{errorEnvio}</Aviso>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
