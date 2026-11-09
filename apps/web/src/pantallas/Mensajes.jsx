import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatearFechaRelativa, mapearProblema } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Icono } from "../componentes/Icono.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./mensajes.module.css";

const LIMITE = 10;

function iniciales(nombre) {
  if (!nombre) return "?";
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function contraparte(conversacion, usuarioId) {
  if (conversacion.compradorId === usuarioId) {
    return {
      nombre: conversacion.anuncio?.vendedorNombre ?? "Vendedor",
      etiqueta: "Compra",
    };
  }
  return { nombre: "Comprador", etiqueta: "Venta" };
}

export function Mensajes() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === "autenticado";
  const usuarioId = estado.usuario?.id;

  const [pagina, setPagina] = useState(0);
  const [conversaciones, setConversaciones] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (restaurado && !autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar, restaurado]);

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

  if (!restaurado || !autenticado) {
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
        <Link to="/mis-anuncios" className={estilos.enlaceDestacado}>
          Mis anuncios
        </Link>
      </CabeceraPublica>

      <main className={estilos.principal}>
        <div className={estilos.encabezado}>
          <div>
            <h1 className={estilos.titulo}>Mensajes</h1>
            <p className={estilos.subtitulo}>
              Tus conversaciones de compra y venta.
            </p>
          </div>
        </div>

        {cargando && (
          <p className={estilos.estado} role="status">
            Cargando tus conversaciones…
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

        {!cargando && !error && conversaciones.length === 0 && (
          <div className={estilos.vacio}>
            <div className={estilos.vacioIcono} aria-hidden="true">
              <Icono nombre="mensajes" tamano={24} />
            </div>
            <h2 className={estilos.vacioTitulo}>
              Aún no tienes conversaciones
            </h2>
            <p className={estilos.vacioTexto}>
              Cuando contactes a un vendedor o alguien te escriba, aparecerá
              aquí.
            </p>
            <Link to="/" className={estilos.primario}>
              Explorar catálogo
            </Link>
          </div>
        )}

        {!cargando && !error && conversaciones.length > 0 && (
          <>
            <ul className={estilos.lista}>
              {conversaciones.map((conversacion) => {
                const otro = contraparte(conversacion, usuarioId);
                const ultimo = conversacion.ultimoMensaje;
                const noLeidos = conversacion.noLeidos ?? 0;
                return (
                  <li key={conversacion.id}>
                    <Link
                      to={`/mensajes/${conversacion.id}`}
                      className={estilos.fila}
                    >
                      <div className={estilos.avatar} aria-hidden="true">
                        {iniciales(otro.nombre)}
                      </div>
                      <div className={estilos.datos}>
                        <p className={estilos.nombre}>
                          {conversacion.anuncio?.nombre ?? "Conversación"}
                        </p>
                        <p className={estilos.mensaje}>
                          {ultimo?.texto ?? "Sin mensajes todavía"}
                        </p>
                        <p className={estilos.meta}>
                          {otro.etiqueta} · {otro.nombre}
                        </p>
                      </div>
                      <div className={estilos.metaColumna}>
                        <span className={estilos.cuando}>
                          {formatearFechaRelativa(
                            conversacion.fechaActualizacion,
                          )}
                        </span>
                        {noLeidos > 0 && (
                          <span
                            className={estilos.noLeidos}
                            aria-label={`${noLeidos} sin leer`}
                          >
                            {noLeidos}
                          </span>
                        )}
                      </div>
                    </Link>
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
