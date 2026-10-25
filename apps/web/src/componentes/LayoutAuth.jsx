import { Link } from "react-router-dom";
import { Icono } from "./Icono.jsx";
import { SelectorTema } from "./SelectorTema.jsx";
import estilos from "./LayoutAuth.module.css";

/**
 * Marco de las pantallas de sesión: cabecera mínima + tarjeta centrada.
 * El diseño está en design/uni-market.fig (páginas 02–07).
 *
 * `resultado` cambia la tarjeta al patrón de desenlace (icono, título y cuerpo
 * centrados) que usan confirmación, restablecimiento y registro.
 */
export function LayoutAuth({
  titulo,
  subtitulo,
  children,
  idTitulo = "titulo-auth",
  resultado = false,
  icono = null,
}) {
  const claseTarjeta = [
    estilos.tarjeta,
    resultado ? estilos.tarjetaResultado : "",
  ]
    .filter(Boolean)
    .join(" ");
  const claseCabecera = [
    estilos.cabeceraTarjeta,
    resultado ? estilos.cabeceraResultado : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecera}>
        <Link to="/" className={estilos.marca}>
          <span className={estilos.logo} aria-hidden="true" />
          Uni Market
        </Link>
        <div className={estilos.acciones}>
          <SelectorTema />
          <Link to="/" className={estilos.enlace}>
            Volver al catálogo
          </Link>
        </div>
      </header>

      <main className={estilos.centro}>
        <section className={claseTarjeta} aria-labelledby={idTitulo}>
          <div className={claseCabecera}>
            {icono && (
              <div
                className={`${estilos.iconoResultado} ${estilos[icono.tono]}`}
                data-girando={icono.girando ? "true" : undefined}
                aria-hidden="true"
              >
                <Icono nombre={icono.nombre} />
              </div>
            )}
            <h1 id={idTitulo} className={estilos.titulo}>
              {titulo}
            </h1>
            {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}
