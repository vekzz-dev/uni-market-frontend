import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  formatearFecha,
  formatearPrecio,
  mapearProblema,
  puede,
  resolverUrlMedia,
  validarMotivo,
} from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Icono } from "../componentes/Icono.jsx";
import { origenApi } from "../config.js";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./moderacion.module.css";

const LIMITE = 10;

const FILTROS = [
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "aprobado", etiqueta: "Aprobados" },
  { valor: "rechazado", etiqueta: "Rechazados" },
];

export function Moderacion() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const navegar = useNavigate();
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
    if (restaurado && !autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar, restaurado]);

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
        if (problema.status === 401) navegar("/entrar", { replace: true });
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
    navegar,
  ]);

  function filtrar(valor) {
    setFiltro(valor);
    setPagina(0);
    setDecidiendo(null);
    setAviso(null);
    setErrorDecision(null);
  }

  function abrirDecision(anuncio, decision) {
    setErrorDecision(null);
    setAviso(null);
    if (decision === "aprobar") {
      confirmar(anuncio, "aprobar", "");
      return;
    }
    setDecidiendo({ anuncio, decision });
    setMotivo("");
  }

  async function confirmar(anuncio, decision, textoMotivo) {
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
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorDecision(problema.mensaje);
    } finally {
      setEnviando(false);
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

  if (!esModerador) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
        <main className={estilos.principal}>
          <div className={estilos.sinAcceso}>
            <h1 className={estilos.titulo}>No tienes acceso a moderación</h1>
            <p className={estilos.subtitulo}>
              Esta sección es para moderadores. Vuelve al catálogo.
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
        <Link to="/" className={estilos.enlace}>
          Catálogo
        </Link>
        {puede(estado.usuario?.rol, "categorias.gestionar") && (
          <Link to="/admin/categorias" className={estilos.enlace}>
            Categorías
          </Link>
        )}
        {puede(estado.usuario?.rol, "admin.usuarios") && (
          <Link to="/admin/usuarios" className={estilos.enlace}>
            Usuarios
          </Link>
        )}
      </CabeceraPublica>

      <main className={estilos.principal}>
        <div className={estilos.encabezado}>
          <div>
            <h1 className={estilos.titulo}>Moderación</h1>
            <p className={estilos.subtitulo}>
              Revisa los anuncios pendientes, del más antiguo al más nuevo.
            </p>
          </div>
        </div>

        <div
          className={estilos.filtros}
          role="group"
          aria-label="Filtrar por estado"
        >
          {FILTROS.map(({ valor, etiqueta }) => (
            <button
              key={valor}
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

        {cargando && (
          <p className={estilos.estado} role="status">
            Cargando la cola…
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

        {!cargando && !error && anuncios.length === 0 && (
          <div className={estilos.vacio}>
            <div className={estilos.vacioIcono} aria-hidden="true">
              <Icono nombre="exito" tamano={24} />
            </div>
            <h2 className={estilos.vacioTitulo}>
              {filtro === "pendiente"
                ? "No hay anuncios pendientes"
                : "No hay anuncios en este estado"}
            </h2>
            <p className={estilos.vacioTexto}>
              {filtro === "pendiente"
                ? "Cuando se publique uno nuevo, aparecerá aquí."
                : "Prueba con otro filtro."}
            </p>
          </div>
        )}

        {!cargando && !error && anuncios.length > 0 && (
          <>
            <ul className={estilos.lista}>
              {anuncios.map((anuncio) => {
                const imagen = anuncio.imagenUrls?.[0];
                const abierto = decidiendo?.anuncio.id === anuncio.id;
                return (
                  <li key={anuncio.id}>
                    <article className={estilos.fila}>
                      <div className={estilos.miniatura}>
                        {imagen ? (
                          <img
                            src={resolverUrlMedia(imagen, origenApi)}
                            alt=""
                          />
                        ) : (
                          <Icono nombre="imagen" tamano={20} />
                        )}
                      </div>
                      <div className={estilos.datos}>
                        <p className={estilos.nombre}>{anuncio.nombre}</p>
                        <p className={estilos.precio}>
                          {formatearPrecio(anuncio.precio)}
                        </p>
                        <p className={estilos.meta}>
                          Vendedor: {anuncio.vendedorNombre ?? "—"} ·{" "}
                          {formatearFecha(anuncio.fechaCreacion)}
                        </p>
                      </div>
                      <div className={estilos.acciones}>
                        {filtro === "pendiente" && (
                          <>
                            <Boton
                              className={estilos.accion}
                              disabled={enviando}
                              onClick={() => abrirDecision(anuncio, "aprobar")}
                            >
                              Aprobar
                            </Boton>
                            <Boton
                              variante="secundario"
                              className={estilos.accion}
                              disabled={enviando}
                              onClick={() => abrirDecision(anuncio, "rechazar")}
                            >
                              Rechazar
                            </Boton>
                          </>
                        )}
                        {filtro === "aprobado" && (
                          <Boton
                            variante="secundario"
                            className={estilos.accion}
                            disabled={enviando}
                            onClick={() => abrirDecision(anuncio, "retraer")}
                          >
                            Retraer
                          </Boton>
                        )}
                      </div>

                      {abierto && (
                        <div className={estilos.decision}>
                          <label
                            className={estilos.etiqueta}
                            htmlFor={`motivo-${anuncio.id}`}
                          >
                            Motivo del rechazo
                          </label>
                          <textarea
                            id={`motivo-${anuncio.id}`}
                            className={estilos.textarea}
                            value={motivo}
                            onChange={(evento) =>
                              setMotivo(evento.target.value)
                            }
                            placeholder="Explica qué debe corregir el vendedor…"
                          />
                          {errorDecision && <Aviso>{errorDecision}</Aviso>}
                          <div className={estilos.decisionAcciones}>
                            <Boton
                              variante="secundario"
                              className={estilos.accion}
                              onClick={() => setDecidiendo(null)}
                            >
                              Cancelar
                            </Boton>
                            <Boton
                              variante="peligro"
                              className={estilos.accion}
                              cargando={enviando}
                              onClick={() =>
                                confirmar(anuncio, decidiendo.decision, motivo)
                              }
                            >
                              Confirmar {decidiendo.decision}
                            </Boton>
                          </div>
                        </div>
                      )}
                    </article>
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
