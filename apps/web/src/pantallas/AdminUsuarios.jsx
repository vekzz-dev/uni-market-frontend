import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapearProblema, puede } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./admin.module.css";

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
  const navegar = useNavigate();
  const autenticado = estado.estado === "autenticado";
  const esAdmin = puede(estado.usuario?.rol, "admin.usuarios");

  const [filtro, setFiltro] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [accionando, setAccionando] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar, restaurado]);

  useEffect(() => {
    if (!autenticado || !esAdmin) return undefined;
    let vigente = true;
    setCargando(true);
    setError(null);

    const opciones = { pagina, limite: LIMITE };
    if (filtro) opciones.rol = filtro;

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
        if (problema.status === 401) navegar("/entrar", { replace: true });
        else setError(problema.mensaje);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [autenticado, cliente, esAdmin, filtro, pagina, recarga, sesion, navegar]);

  function filtrar(valor) {
    setFiltro(valor);
    setPagina(0);
    setAviso(null);
    setErrorAccion(null);
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
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
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
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorAccion(problema.mensaje);
    } finally {
      setAccionando(null);
    }
  }

  if (!restaurado || !autenticado) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
        <main className={estilos.principal}>
          <div className={estilos.sinAcceso}>
            <h1 className={estilos.titulo}>
              No tienes acceso a administración
            </h1>
            <p className={estilos.subtitulo}>
              Esta sección es para administradores. Vuelve al catálogo.
            </p>
            <Link to="/" className={estilos.primario}>
              Ir al catálogo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      >
        <Link to="/admin/categorias" className={estilos.enlace}>
          Categorías
        </Link>
        <Link to="/moderacion" className={estilos.enlace}>
          Moderación
        </Link>
      </CabeceraPublica>

      <main className={estilos.principal}>
        <div className={estilos.encabezado}>
          <div>
            <h1 className={estilos.titulo}>Usuarios</h1>
            <p className={estilos.subtitulo}>
              Roles y estado de las cuentas activas.
            </p>
          </div>
        </div>

        <div
          className={estilos.filtros}
          role="group"
          aria-label="Filtrar por rol"
        >
          {FILTROS.map(({ valor, etiqueta }) => (
            <button
              key={etiqueta}
              type="button"
              className={`${estilos.chip} ${
                filtro === valor ? estilos.chipActivo : ""
              }`}
              aria-pressed={filtro === valor}
              onClick={() => filtrar(valor)}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        {aviso && <Aviso tono="exito">{aviso}</Aviso>}
        {errorAccion && <Aviso>{errorAccion}</Aviso>}

        {cargando && (
          <p className={estilos.estado} role="status">
            Cargando usuarios…
          </p>
        )}

        {!cargando && error && (
          <div className={estilos.estadoError}>
            <Aviso>{error}</Aviso>
            <Boton
              variante="secundario"
              onClick={() => setRecarga((n) => n + 1)}
            >
              Reintentar
            </Boton>
          </div>
        )}

        {!cargando && !error && usuarios.length === 0 && (
          <div className={estilos.vacio}>
            <h2 className={estilos.vacioTitulo}>No hay usuarios con ese rol</h2>
            <p className={estilos.vacioTexto}>Prueba con otro filtro.</p>
          </div>
        )}

        {!cargando && !error && usuarios.length > 0 && (
          <>
            <ul className={estilos.lista}>
              {usuarios.map((usuario) => {
                const esYo = usuario.id === estado.usuario?.id;
                return (
                  <li key={usuario.id} className={estilos.fila}>
                    <div className={estilos.datos}>
                      <p className={estilos.nombre}>{usuario.nombre}</p>
                      <p className={estilos.meta}>{usuario.email}</p>
                    </div>

                    <span
                      className={`${estilos.badge} ${estilos[usuario.rol]}`}
                    >
                      {usuario.rol}
                    </span>
                    <span
                      className={`${estilos.badge} ${
                        usuario.habilitado
                          ? estilos.habilitado
                          : estilos.inactivo
                      }`}
                    >
                      {usuario.habilitado ? "Habilitado" : "Inhabilitado"}
                    </span>

                    <div className={estilos.acciones}>
                      <label
                        className={estilos.oculto}
                        htmlFor={`rol-${usuario.id}`}
                      >
                        Rol de {usuario.nombre}
                      </label>
                      {esYo ? (
                        <span className={estilos.yo}>Tú</span>
                      ) : (
                        <>
                          <select
                            id={`rol-${usuario.id}`}
                            className={estilos.selector}
                            value={usuario.rol}
                            disabled={accionando === usuario.id}
                            onChange={(evento) =>
                              cambiarRol(usuario, evento.target.value)
                            }
                          >
                            {ROLES.map((rol) => (
                              <option key={rol} value={rol}>
                                {rol}
                              </option>
                            ))}
                          </select>
                          <Boton
                            variante="secundario"
                            className={estilos.accion}
                            disabled={accionando === usuario.id}
                            onClick={() => cambiarHabilitacion(usuario)}
                          >
                            {usuario.habilitado ? "Inhabilitar" : "Habilitar"}
                          </Boton>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {paginacion && paginacion.totalPaginas > 1 && (
              <div className={estilos.paginacion}>
                <span>
                  Página {pagina + 1} de {paginacion.totalPaginas}
                </span>
                <div className={estilos.acciones}>
                  <Boton
                    variante="secundario"
                    className={estilos.accion}
                    disabled={pagina === 0}
                    onClick={() => setPagina((n) => n - 1)}
                  >
                    Anterior
                  </Boton>
                  <Boton
                    variante="secundario"
                    className={estilos.accion}
                    disabled={pagina + 1 >= paginacion.totalPaginas}
                    onClick={() => setPagina((n) => n + 1)}
                  >
                    Siguiente
                  </Boton>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
