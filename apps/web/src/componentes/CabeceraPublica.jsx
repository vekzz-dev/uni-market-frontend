import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icono } from "./Icono.jsx";
import { SelectorTema } from "./SelectorTema.jsx";
import estilos from "./CabeceraPublica.module.css";

/**
 * Cabecera pública del catálogo y del detalle: marca, búsqueda y acciones de cuenta.
 * `onBuscar` recibe el texto recortado; vacío significa "quitar la búsqueda".
 */
export function CabeceraPublica({ inicial = "", onBuscar, children }) {
  const [texto, setTexto] = useState(inicial);

  // Si el catálogo limpia los filtros, el campo debe vaciarse con él.
  useEffect(() => {
    setTexto(inicial);
  }, [inicial]);

  function enviar(evento) {
    evento.preventDefault();
    onBuscar(texto.trim());
  }

  return (
    <header className={estilos.cabecera}>
      <Link to="/" className={estilos.marca}>
        <span className={estilos.logo} aria-hidden="true" />
        Uni Market
      </Link>

      <form className={estilos.buscador} onSubmit={enviar} role="search">
        <Icono nombre="buscar" tamano={16} />
        <input
          className={estilos.entrada}
          type="search"
          aria-label="Buscar en el catálogo"
          placeholder="Buscar en el catálogo"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <button type="submit" className={estilos.botonBuscar}>
          Buscar
        </button>
      </form>

      <nav className={estilos.acciones} aria-label="Cuenta">
        <SelectorTema />
        {children}
      </nav>
    </header>
  );
}
