import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  formatearPrecio,
  mapearProblema,
  resolverUrlMedia,
} from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Icono } from "../componentes/Icono.jsx";
import { origenApi } from "../config.js";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./misAnuncios.module.css";

const LIMITE = 10;

function estadoVisible(anuncio) {
  if (anuncio.estado === "vendido") return { texto: "Vendido", tono: "neutro" };
  if (anuncio.estadoRevision === "pendiente")
    return { texto: "Pendiente", tono: "advertencia" };
  if (anuncio.estadoRevision === "rechazado")
    return { texto: "Rechazado", tono: "error" };
  if (anuncio.estado === "inactivo")
    return { texto: "Inactivo", tono: "neutro" };
  if (anuncio.estadoRevision === "aprobado")
    return { texto: "Aprobado", tono: "exito" };
  return { texto: anuncio.estadoRevision ?? "—", tono: "neutro" };
}

export function MisAnuncios() {
  const { cliente, sesion, estado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === "autenticado";

  const [pagina, setPagina] = useState(0);
  const [anuncios, setAnuncios] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [accionando, setAccionando] = useState(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar]);

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
        setAnuncios(respuesta.datos ?? []);
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
  }, [autenticado, cliente, pagina, recarga, sesion, navegar]);

  async function accion(id, operacion) {
    setAccionando(id);
    setErrorAccion(null);
    try {
      await sesion.ejecutar(operacion);
      setRecarga((n) => n + 1);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorAccion(problema.mensaje);
    } finally {
      setAccionando(null);
    }
  }

  function alternar(anuncio) {
    const visible = anuncio.estado !== "disponible";
    accion(anuncio.id, () =>
      cliente.anuncios.alternarVisibilidad(anuncio.id, { visible }),
    );
  }

  function vender(anuncio) {
    if (!globalThis.confirm?.("¿Marcar este anuncio como vendido?")) return;
    accion(anuncio.id, () => cliente.anuncios.marcarVendido(anuncio.id));
  }

  function eliminar(anuncio) {
    if (
      !globalThis.confirm?.("¿Dar de baja este anuncio? No se puede deshacer.")
    )
      return;
    accion(anuncio.id, () => cliente.anuncios.darDeBajaAnuncio(anuncio.id));
  }

  if (!autenticado) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
      </div>
    );
  }

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      >
        <Link to="/publicar" className={estilos.enlaceDestacado}>
          Publicar anuncio
        </Link>
      </CabeceraPublica>

      <main className={estilos.principal}>
        <div className={estilos.encabezado}>
          <div>
            <h1 className={estilos.titulo}>Mis anuncios</h1>
            <p className={estilos.subtitulo}>
              Revisa el estado de cada publicación y gestiónala.
            </p>
          </div>
          <Link to="/publicar" className={estilos.primario}>
            Publicar anuncio
          </Link>
        </div>

        {errorAccion && <Aviso>{errorAccion}</Aviso>}

        {cargando && (
          <p className={estilos.estado} role="status">
            Cargando tus anuncios…
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
              <Icono nombre="imagen" tamano={24} />
            </div>
            <h2 className={estilos.vacioTitulo}>Aún no publicaste nada</h2>
            <p className={estilos.vacioTexto}>
              Publica tu primer anuncio; quedará pendiente hasta que lo revise
              un moderador.
            </p>
            <Link to="/publicar" className={estilos.primario}>
              Publicar anuncio
            </Link>
          </div>
        )}

        {!cargando && !error && anuncios.length > 0 && (
          <>
            <ul className={estilos.lista}>
              {anuncios.map((anuncio) => {
                const badge = estadoVisible(anuncio);
                const imagen = anuncio.imagenUrls?.[0];
                const disponible = anuncio.estado === "disponible";
                const aprobado = anuncio.estadoRevision === "aprobado";
                return (
                  <li key={anuncio.id} className={estilos.fila}>
                    <div className={estilos.miniatura}>
                      {imagen ? (
                        <img src={resolverUrlMedia(imagen, origenApi)} alt="" />
                      ) : (
                        <Icono nombre="imagen" tamano={20} />
                      )}
                    </div>
                    <div className={estilos.datos}>
                      <p className={estilos.nombre}>{anuncio.nombre}</p>
                      <p className={estilos.precio}>
                        {formatearPrecio(anuncio.precio)}
                      </p>
                      {anuncio.estadoRevision === "rechazado" &&
                      anuncio.motivoRechazo ? (
                        <p className={estilos.motivo}>
                          {anuncio.motivoRechazo}
                        </p>
                      ) : (
                        <p className={estilos.meta}>
                          {disponible
                            ? "Visible en el catálogo"
                            : "No visible en el catálogo"}
                        </p>
                      )}
                    </div>
                    <div className={estilos.estadoColumna}>
                      <span
                        className={`${estilos.badge} ${estilos[badge.tono]}`}
                      >
                        {badge.texto}
                      </span>
                      <div className={estilos.acciones}>
                        {aprobado && anuncio.estado !== "vendido" && (
                          <Boton
                            variante="secundario"
                            className={estilos.accion}
                            disabled={accionando === anuncio.id}
                            onClick={() => alternar(anuncio)}
                          >
                            {disponible ? "Ocultar" : "Mostrar"}
                          </Boton>
                        )}
                        {aprobado && disponible && (
                          <Boton
                            variante="secundario"
                            className={estilos.accion}
                            disabled={accionando === anuncio.id}
                            onClick={() => vender(anuncio)}
                          >
                            Vendido
                          </Boton>
                        )}
                        <Boton
                          variante="secundario"
                          className={estilos.accion}
                          disabled={accionando === anuncio.id}
                          onClick={() => eliminar(anuncio)}
                        >
                          Eliminar
                        </Boton>
                      </div>
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
