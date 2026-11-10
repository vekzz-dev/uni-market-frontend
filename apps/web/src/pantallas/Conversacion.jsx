import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  formatearFechaRelativa,
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
import estilos from "./conversacion.module.css";

const LIMITE = 30;

export function Conversacion() {
  const { id } = useParams();
  const { cliente, sesion, estado, restaurado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === "autenticado";
  const usuarioId = estado.usuario?.id;

  const [conversacion, setConversacion] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [vista, setVista] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const finalRef = useRef(null);

  useEffect(() => {
    if (restaurado && !autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar, restaurado]);

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
        // Acción explícita: ningún GET marca como leído.
        if ((detalle?.noLeidos ?? 0) > 0) {
          sesion
            .ejecutar(() => cliente.mensajes.marcarLecturas(id))
            .catch(() => {});
        }
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 401) navegar("/entrar", { replace: true });
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
  }, [autenticado, cliente, id, navegar, recarga, sesion]);

  useEffect(() => {
    finalRef.current?.scrollIntoView?.({ block: "end" });
  }, [mensajes]);

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
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorEnvio(problema.mensaje);
    } finally {
      setCargandoAnteriores(false);
    }
  }

  async function enviar(evento) {
    evento.preventDefault();
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
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorEnvio(problema.mensaje);
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

  const anuncio = conversacion?.anuncio ?? null;
  const imagen = anuncio?.imagenUrls?.[0];

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      >
        <Link to="/mensajes" className={estilos.enlace}>
          Mis mensajes
        </Link>
      </CabeceraPublica>

      <main className={estilos.principal}>
        <section
          className={estilos.tarjeta}
          aria-label="Conversación"
          aria-busy={vista === "cargando" || undefined}
        >
          {vista === "cargando" && (
            <p className={estilos.estado} role="status">
              Cargando la conversación…
            </p>
          )}

          {vista === "no-encontrada" && (
            <div className={estilos.centro}>
              <h1 className={estilos.titulo}>
                No encontramos esa conversación
              </h1>
              <p className={estilos.subtitulo}>
                Puede que ya no exista o que no participes en ella.
              </p>
              <Link to="/mensajes" className={estilos.primario}>
                Ir a mis mensajes
              </Link>
            </div>
          )}

          {vista === "error" && (
            <div className={estilos.centro}>
              <h1 className={estilos.titulo}>
                No pudimos cargar la conversación
              </h1>
              <Aviso>{errorCarga}</Aviso>
              <Boton
                variante="secundario"
                onClick={() => setRecarga((n) => n + 1)}
              >
                Reintentar
              </Boton>
            </div>
          )}

          {vista === "listo" && (
            <>
              <div className={estilos.cabecera}>
                <div className={estilos.miniatura}>
                  {imagen ? (
                    <img src={resolverUrlMedia(imagen, origenApi)} alt="" />
                  ) : (
                    <Icono nombre="imagen" tamano={18} />
                  )}
                </div>
                <div className={estilos.datosAnuncio}>
                  <p className={estilos.nombreAnuncio}>
                    {anuncio?.nombre ?? "Conversación"}
                  </p>
                  <p className={estilos.meta}>
                    {anuncio?.precio != null
                      ? formatearPrecio(anuncio.precio)
                      : ""}
                    {conversacion?.contraparteNombre
                      ? ` · Con ${conversacion.contraparteNombre}`
                      : ""}
                  </p>
                </div>
                {anuncio?.id && (
                  <Link
                    to={`/anuncios/${anuncio.id}`}
                    className={estilos.secundario}
                  >
                    Ver anuncio
                  </Link>
                )}
              </div>

              <div className={estilos.historial}>
                {cursor && (
                  <Boton
                    variante="secundario"
                    className={estilos.cargarAnteriores}
                    cargando={cargandoAnteriores}
                    onClick={cargarAnteriores}
                  >
                    Cargar anteriores
                  </Boton>
                )}

                {mensajes.length === 0 && (
                  <div className={estilos.vacio}>
                    <p className={estilos.tituloVacio}>Aún no hay mensajes</p>
                    <p className={estilos.subtitulo}>
                      Escribe el primero para empezar la conversación.
                    </p>
                  </div>
                )}

                <ul className={estilos.mensajes}>
                  {mensajes.map((mensaje) => {
                    const propio = mensaje.remitenteId === usuarioId;
                    return (
                      <li
                        key={mensaje.id}
                        className={propio ? estilos.filaPropia : estilos.fila}
                      >
                        <div
                          className={
                            propio ? estilos.burbujaPropia : estilos.burbuja
                          }
                        >
                          <p className={estilos.texto}>{mensaje.texto}</p>
                          <span className={estilos.hora}>
                            {formatearFechaRelativa(mensaje.fechaCreacion)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div ref={finalRef} />
              </div>

              <form className={estilos.compositor} onSubmit={enviar} noValidate>
                <label className={estilos.oculto} htmlFor="mensaje">
                  Mensaje
                </label>
                <input
                  id="mensaje"
                  className={estilos.campo}
                  value={texto}
                  onChange={(evento) => setTexto(evento.target.value)}
                  placeholder="Escribe un mensaje…"
                  autoComplete="off"
                />
                <Boton
                  type="submit"
                  className={estilos.enviar}
                  cargando={enviando}
                  aria-label="Enviar mensaje"
                >
                  <Icono nombre="enviar" tamano={18} />
                </Boton>
                {errorEnvio && <Aviso>{errorEnvio}</Aviso>}
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
