import { Link } from 'react-router-dom';
import { formatearFechaRelativa, formatearPrecio, resolverUrlMedia } from '@uni-market/core';
import { Icono } from '../componentes/Icono.jsx';
import { origenApi } from '../config.js';
import estilos from './TarjetaAnuncio.module.css';

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Tarjeta del catálogo. El contrato público no expone el nombre del vendedor
 * (solo `vendedorId`), así que la tarjeta muestra categoría y fecha, no autor.
 */
export function TarjetaAnuncio({ anuncio, categoria }) {
  const imagen = anuncio.imagenUrls?.[0];
  const url = imagen ? resolverUrlMedia(imagen, origenApi) : null;

  return (
    <article className={estilos.tarjeta}>
      <Link to={`/anuncios/${anuncio.id}`} className={estilos.enlace}>
        <div className={estilos.media}>
          {url ? (
            <img className={estilos.imagen} src={url} alt="" loading="lazy" />
          ) : (
            <Icono nombre="imagen" tamano={40} />
          )}
        </div>
        <div className={estilos.cuerpo}>
          <h2 className={estilos.nombre}>{anuncio.nombre}</h2>
          <p className={estilos.precio}>{formatearPrecio(anuncio.precio)}</p>
          <div className={estilos.meta}>
            <span>
              {categoria?.nombre ?? 'Sin categoría'}
              {anuncio.vendedorNombre ? ` · ${anuncio.vendedorNombre}` : ''}
            </span>
            <span>{capitalizar(formatearFechaRelativa(anuncio.fechaCreacion))}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
