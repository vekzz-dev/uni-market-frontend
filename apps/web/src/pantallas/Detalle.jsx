import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatearFecha, formatearPrecio, mapearProblema, resolverUrlMedia } from '@uni-market/core';
import { Boton } from '../componentes/Boton.jsx';
import { CabeceraPublica } from '../componentes/CabeceraPublica.jsx';
import { Icono } from '../componentes/Icono.jsx';
import { origenApi } from '../config.js';
import { useSesion } from '../sesion/SesionContexto.jsx';
import estilos from './detalle.module.css';

export function Detalle() {
  const { id } = useParams();
  const { cliente, estado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === 'autenticado';

  const [anuncio, setAnuncio] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [vista, setVista] = useState('cargando');
  const [error, setError] = useState(null);
  const [indice, setIndice] = useState(0);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    setVista('cargando');

    Promise.all([
      cliente.catalogo.leerAnuncio(id),
      cliente.categorias.listarCategorias().catch(() => ({ datos: [] })),
    ])
      .then(([detalle, categorias]) => {
        if (!vigente) return;
        setAnuncio(detalle);
        setCategoria(
          (categorias.datos ?? []).find(
            (item) => String(item.id) === String(detalle.categoriaId),
          ) ?? null,
        );
        setVista('listo');
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 404) {
          setVista('no-disponible');
        } else {
          setError(problema.mensaje);
          setVista('error');
        }
      });

    return () => {
      vigente = false;
    };
  }, [cliente, id, recarga]);

  const imagenes = (anuncio?.imagenUrls ?? []).map((url) => resolverUrlMedia(url, origenApi));
  const imagenActual = imagenes[indice] ?? null;

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : '/')}>
        {autenticado ? (
          <span className={estilos.saludo}>Hola, {estado.usuario?.nombre}</span>
        ) : (
          <Link to="/entrar" className={estilos.enlace}>
            Entrar
          </Link>
        )}
      </CabeceraPublica>

      <main className={estilos.principal}>
        {vista === 'cargando' && (
          <p className={estilos.estado} role="status">
            Cargando anuncio…
          </p>
        )}

        {vista === 'no-disponible' && (
          <section className={estilos.desenlace} aria-labelledby="titulo-desenlace">
            <div className={`${estilos.icono} ${estilos.error}`} aria-hidden="true">
              <Icono nombre="enlaceRoto" />
            </div>
            <h1 id="titulo-desenlace" className={estilos.desenlaceTitulo}>
              Este anuncio ya no está disponible
            </h1>
            <p className={estilos.desenlaceTexto}>
              Puede que se haya vendido o que ya no esté publicado.
            </p>
            <Link to="/" className={estilos.secundario}>
              Volver al catálogo
            </Link>
          </section>
        )}

        {vista === 'error' && (
          <section className={estilos.desenlace} aria-labelledby="titulo-desenlace">
            <div className={`${estilos.icono} ${estilos.advertencia}`} aria-hidden="true">
              <Icono nombre="alerta" />
            </div>
            <h1 id="titulo-desenlace" className={estilos.desenlaceTitulo}>
              No pudimos cargar el anuncio
            </h1>
            <p className={estilos.desenlaceTexto}>{error}</p>
            <div className={estilos.accionesDesenlace}>
              <Boton onClick={() => setRecarga((n) => n + 1)}>Reintentar</Boton>
              <Link to="/" className={estilos.secundario}>
                Volver al catálogo
              </Link>
            </div>
          </section>
        )}

        {vista === 'listo' && anuncio && (
          <>
            <p className={estilos.migas}>
              <Link to="/">Catálogo</Link>
              {categoria ? ` / ${categoria.nombre}` : ''}
            </p>

            <div className={estilos.columnas}>
              <div className={estilos.galeria}>
                <div className={estilos.imagenPrincipal}>
                  {imagenActual ? (
                    <img className={estilos.imagen} src={imagenActual} alt={anuncio.nombre} />
                  ) : (
                    <Icono nombre="imagen" tamano={48} />
                  )}
                </div>

                {imagenes.length > 1 && (
                  <div className={estilos.miniaturas}>
                    {imagenes.map((url, posicion) => (
                      <button
                        key={url}
                        type="button"
                        className={estilos.miniatura}
                        aria-label={`Ver imagen ${posicion + 1}`}
                        aria-pressed={posicion === indice}
                        onClick={() => setIndice(posicion)}
                      >
                        <img className={estilos.imagen} src={url} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={estilos.informacion}>
                <span className={estilos.chip}>{categoria?.nombre ?? 'Sin categoría'}</span>
                <h1 className={estilos.titulo}>{anuncio.nombre}</h1>
                <p className={estilos.precio}>{formatearPrecio(anuncio.precio)}</p>
                <p className={estilos.meta}>
                  Publicado el {formatearFecha(anuncio.fechaCreacion)}
                  {imagenes.length > 1 ? ` · ${imagenes.length} imágenes` : ''}
                </p>

                <div className={estilos.separador} />

                {anuncio.descripcion && (
                  <p className={estilos.descripcion}>{anuncio.descripcion}</p>
                )}

                {!autenticado && (
                  <div className={estilos.contacto}>
                    <h2 className={estilos.contactoTitulo}>¿Te interesa?</h2>
                    <p className={estilos.contactoTexto}>
                      Inicia sesión para contactar al vendedor.
                    </p>
                    <Link to="/entrar" className={estilos.primario}>
                      Entrar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
