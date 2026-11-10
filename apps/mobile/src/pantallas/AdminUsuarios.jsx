import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { mapearProblema, puede } from "@uni-market/core";
import { Aviso, Boton, Cabecera, Estado } from "../componentes/ui.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import { useTema } from "../tema.js";

const LIMITE = 10;
const ROLES = ["miembro", "moderador", "admin"];
const FILTROS = [
  { valor: null, etiqueta: "Todos" },
  { valor: "miembro", etiqueta: "Miembros" },
  { valor: "moderador", etiqueta: "Moderadores" },
  { valor: "admin", etiqueta: "Admins" },
];

export function AdminUsuarios() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const { semantic: c } = useTema();
  const router = useRouter();
  const autenticado = estado.estado === "autenticado";
  const esAdmin = puede(estado.usuario?.rol, "admin.usuarios");

  const [filtro, setFiltro] = useState(null);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [accionando, setAccionando] = useState(null);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) router.replace("/entrar");
  }, [autenticado, restaurado, router]);

  useEffect(() => {
    if (!autenticado || !esAdmin) return undefined;
    let vigente = true;
    setCargando(true);
    setError(null);

    const opciones = { pagina, limite: LIMITE };
    if (filtro) opciones.rol = filtro;
    if (busqueda) opciones.q = busqueda;

    sesion
      .ejecutar(() => cliente.administracion.listarUsuarios(opciones))
      .then((respuesta) => {
        if (!vigente) return;
        const datos = respuesta.datos ?? [];
        if (datos.length === 0 && pagina > 0) {
          setPagina((actual) => Math.max(0, actual - 1));
          return;
        }
        setUsuarios(datos);
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
    busqueda,
    cliente,
    esAdmin,
    filtro,
    pagina,
    recarga,
    sesion,
    router,
  ]);

  function filtrar(valor) {
    setFiltro(valor);
    setPagina(0);
    setAviso(null);
    setErrorAccion(null);
  }

  function buscar() {
    setBusqueda(texto.trim());
    setPagina(0);
  }

  async function cambiarRol(usuario, rol) {
    setAccionando(usuario.id);
    setErrorAccion(null);
    setAviso(null);
    try {
      const actualizado = await sesion.ejecutar(() =>
        cliente.administracion.cambiarRol(usuario.id, { rol }),
      );
      setUsuarios((vigentes) =>
        vigentes.map((u) => (u.id === usuario.id ? actualizado : u)),
      );
      setAviso(`Rol de ${usuario.nombre} actualizado a ${actualizado.rol}.`);
      setAbierto(null);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) router.replace("/entrar");
      else if (problema.status === 403)
        setErrorAccion("No puedes cambiar tu propio rol.");
      else setErrorAccion(problema.mensaje);
    } finally {
      setAccionando(null);
    }
  }

  async function cambiarHabilitacion(usuario) {
    setAccionando(usuario.id);
    setErrorAccion(null);
    setAviso(null);
    try {
      const actualizado = await sesion.ejecutar(() =>
        cliente.administracion.cambiarHabilitacion(usuario.id, {
          habilitado: !usuario.habilitado,
        }),
      );
      setUsuarios((vigentes) =>
        vigentes.map((u) => (u.id === usuario.id ? actualizado : u)),
      );
      setAviso(
        `${usuario.nombre} queda ${actualizado.habilitado ? "habilitado" : "inhabilitado"}.`,
      );
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
            Inicia sesión para administrar
          </Text>
          <Boton titulo="Entrar" onPress={() => router.push("/entrar")} />
        </View>
      </View>
    );
  }

  if (!esAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primarySoft }}>
        <Cabecera />
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>
            No tienes acceso a administración
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
          Usuarios
        </Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            accessibilityLabel="Buscar usuarios"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={buscar}
            placeholder="Buscar por nombre o email"
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
            titulo="Buscar"
            variante="secundario"
            onPress={buscar}
            style={{ minHeight: 42, paddingHorizontal: 14 }}
          />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {FILTROS.map(({ valor, etiqueta }) => (
            <Boton
              key={etiqueta}
              titulo={etiqueta}
              variante={filtro === valor ? "primario" : "secundario"}
              onPress={() => filtrar(valor)}
              style={{ minHeight: 32 }}
            />
          ))}
        </View>

        {aviso && <Aviso tono="exito">{aviso}</Aviso>}
        {errorAccion && <Aviso>{errorAccion}</Aviso>}

        {cargando && <Estado>Cargando usuarios…</Estado>}

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

        {!cargando && !error && usuarios.length === 0 && (
          <Estado>Sin usuarios para ese filtro.</Estado>
        )}

        {!cargando &&
          !error &&
          usuarios.map((usuario) => {
            const esYo = usuario.id === estado.usuario?.id;
            return (
              <View
                key={usuario.id}
                style={{
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 12,
                  padding: 14,
                  gap: 8,
                }}
              >
                <Text
                  style={{ color: c.text, fontSize: 16, fontWeight: "600" }}
                >
                  {usuario.nombre}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  {usuario.email}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  {usuario.rol} ·{" "}
                  {usuario.habilitado ? "Habilitado" : "Inhabilitado"}
                </Text>

                {esYo ? (
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                    Tú
                  </Text>
                ) : (
                  <>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Boton
                        titulo="Cambiar rol"
                        variante="secundario"
                        onPress={() =>
                          setAbierto(abierto === usuario.id ? null : usuario.id)
                        }
                        disabled={accionando === usuario.id}
                        style={{ flex: 1, minHeight: 34 }}
                      />
                      <Boton
                        titulo={
                          usuario.habilitado ? "Inhabilitar" : "Habilitar"
                        }
                        variante="secundario"
                        onPress={() => cambiarHabilitacion(usuario)}
                        disabled={accionando === usuario.id}
                        style={{ flex: 1, minHeight: 34 }}
                      />
                    </View>
                    {abierto === usuario.id && (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {ROLES.map((rol) => (
                          <Boton
                            key={rol}
                            titulo={rol}
                            variante={
                              usuario.rol === rol ? "primario" : "secundario"
                            }
                            onPress={() => cambiarRol(usuario, rol)}
                            disabled={accionando === usuario.id}
                            style={{ flex: 1, minHeight: 32 }}
                          />
                        ))}
                      </View>
                    )}
                  </>
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
