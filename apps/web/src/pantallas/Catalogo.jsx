import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fusionarPagina, mapearProblema } from '@uni-market/core';
import { Aviso } from '../componentes/Aviso.jsx';
import { Boton } from '../componentes/Boton.jsx';
import { CabeceraPublica } from '../componentes/CabeceraPublica.jsx';
import { Icono } from '../componentes/Icono.jsx';
import { useSesion } from '../sesion/SesionContexto.jsx';
import { TarjetaAnuncio } from './TarjetaAnuncio.jsx';
import estilos from './catalogo.module.css';

const LIMITE = 12;

export function Catalogo() {
  const { cliente, sesion, estado } = useSesion();
  const navegar = useNavigate();
  const [params, setParams] = useSearchParams();
  const autenticado = estado.estado === 'autenticado';

  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({
    q: params.get('q') ?? '',
    categoriaId: '',
    orden: 'fechaCreacion',
  });
  const [anuncios, setAnuncios] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [errorMas, setErrorMas] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const qUrl = params.get('q') ?? '';

  useEffect(() => {
    setFiltros((actuales) => (actuales.q === qUrl ? actuales : { ...actuales, q: qUrl }));
  }, [qUrl]);

  useEffect(() => {
    cliente.categorias
      .listarCategorias()
      .then((respuesta) => setCategorias(respuesta.datos ?? []))
      .catch(() => setCategorias([]));
  }, [cliente]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);

    const parametros = { orden: filtros.orden, limite: LIMITE };
    if (filtros.q) parametros.q = filtros.q;
    if (filtros.categoriaId) parametros.categoriaId = Number(filtros.categoriaId);

    cliente.catalogo
      .buscarCatalogo(parametros)
      .then((pagina) => {
        if (!vigente) return;
        setAnuncios(pagina.datos ?? []);
        setCursor(pagina.paginacion?.cursorSiguiente ?? null);
      })
      .catch((fallo) => {
        if (!vigente) return;
        setError(mapearProblema(fallo).mensaje);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [cliente, filtros, recarga]);

  const porId = new Map(categorias.map((categoria) => [String(categoria.id), categoria]));

  async function cargarMas() {
    if (!cursor || cargandoMas) return;
    setCargandoMas(true);
    setErrorMas(null);

    const parametros = { orden: filtros.orden, limite: LIMITE, cursor };
    if (filtros.q) parametros.q = filtros.q;
    if (filtros.categoriaId) parametros.categoriaId = Number(filtros.categoriaId);

    try {
      const pagina = await cliente.catalogo.buscarCatalogo(parametros);
      setAnuncios((vigentes) => fusionarPagina(vigentes, pagina.datos ?? []));
      setCursor(pagina.paginacion?.cursorSiguiente ?? null);
    } catch (fallo) {
      setErrorMas(mapearProblema(fallo).mensaje);
    } finally {
      setCargandoMas(false);
    }
  }

  function aplicarBusqueda(q) {
    setFiltros((actuales) => ({ ...actuales, q }));
    setParams(q ? { q } : {}, { replace: true });
  }

  function limpiarFiltros() {
    setParams({}, { replace: true });
    setFiltros({ q: '', categoriaId: '', orden: 'fechaCreacion' });
  }

  async function salir() {
    await sesion.cerrarSesion();
    navegar('/entrar');
  }

  const hayFiltros = Boolean(filtros.q || filtros.categoriaId || filtros.orden !== 'fechaCreacion');

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        inicial={filtros.q}
        onBuscar={aplicarBusqueda}
      >
        {autenticado ? (
          <>
            <span className={estilos.saludo}>Hola, {estado.usuario?.nombre}</span>
            <Boton variante="secundario" className={estilos.botonCuenta} onClick={salir}>
              Cerrar sesión
            </Boton>
          </>
        ) : (
          <>
            <Link to="/entrar" className={estilos.enlace}>
              Entrar
            </Link>
            <Link to="/registro" className={estilos.enlaceDestacado}>
              Crear cuenta
            </Link>
          </>
        )}
      </CabeceraPublica>

      <main className={estilos.principal}>
        <div className={estilos.encabezado}>
          <div>
            <h1 className={estilos.titulo}>Anuncios disponibles</h1>
            <p className={estilos.subtitulo}>
              Todos los anuncios pasan por revisión antes de publicarse.
            </p>
          </div>

          <label className={estilos.orden}>
            <span className={estilos.ordenEtiqueta}>Ordenar</span>
            <select
              className={estilos.selector}
              value={filtros.orden}
              onChange={(evento) =>
                setFiltros((actuales) => ({ ...actuales, orden: evento.target.value }))
              }
            >
              <option value="fechaCreacion">Más recientes</option>
              <option value="precio">Menor precio</option>
            </select>
          </label>
        </div>

        <div className={estilos.chips} role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={estilos.chip}
            aria-pressed={filtros.categoriaId === ''}
            onClick={() => setFiltros((actuales) => ({ ...actuales, categoriaId: '' }))}
          >
            Todas
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              className={estilos.chip}
              aria-pressed={filtros.categoriaId === String(categoria.id)}
              onClick={() =>
                setFiltros((actuales) => ({ ...actuales, categoriaId: String(categoria.id) }))
              }
            >
              {categoria.nombre}
            </button>
          ))}
        </div>

        {cargando && (
          <p className={estilos.estado} role="status">
            Cargando anuncios…
          </p>
        )}

        {!cargando && error && (
          <div className={estilos.estadoError}>
            <Aviso>{error}</Aviso>
            <Boton variante="secundario" onClick={() => setRecarga((n) => n + 1)}>
              Reintentar
            </Boton>
          </div>
        )}

        {!cargando && !error && anuncios.length === 0 && (
          <div className={estilos.vacio}>
            <div className={estilos.vacioIcono} aria-hidden="true">
              <Icono nombre="imagen" tamano={24} />
            </div>
            <h2 className={estilos.vacioTitulo}>No encontramos anuncios</h2>
            <p className={estilos.vacioTexto}>
              {hayFiltros
                ? 'Prueba con otra categoría o cambia la búsqueda.'
                : 'Cuando alguien publique algo, aparecerá aquí.'}
            </p>
            {hayFiltros && (
              <Boton variante="secundario" onClick={limpiarFiltros}>
                Limpiar filtros
              </Boton>
            )}
          </div>
        )}

        {!cargando && !error && anuncios.length > 0 && (
          <>
            <div className={estilos.grilla}>
              {anuncios.map((anuncio) => (
                <TarjetaAnuncio
                  key={anuncio.id}
                  anuncio={anuncio}
                  categoria={porId.get(String(anuncio.categoriaId))}
                />
              ))}
            </div>

            {errorMas && <Aviso>{errorMas}</Aviso>}

            {cursor && (
              <div className={estilos.mas}>
                <Boton variante="secundario" cargando={cargandoMas} onClick={cargarMas}>
                  {cargandoMas ? 'Cargando…' : 'Cargar más anuncios'}
                </Boton>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
