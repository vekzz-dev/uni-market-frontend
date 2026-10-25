import { Link, useNavigate } from "react-router-dom";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Icono } from "../componentes/Icono.jsx";
import estilos from "./noEncontrado.module.css";

export function NoEncontrado() {
  const navegar = useNavigate();

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      />

      <main className={estilos.principal}>
        <section className={estilos.tarjeta} aria-labelledby="titulo-404">
          <div className={estilos.icono} aria-hidden="true">
            <Icono nombre="buscar" tamano={24} />
          </div>
          <p className={estilos.codigo}>404</p>
          <h1 id="titulo-404" className={estilos.titulo}>
            Página no encontrada
          </h1>
          <p className={estilos.texto}>
            La dirección no existe o cambió de sitio. Vuelve al catálogo para
            seguir buscando.
          </p>
          <Link to="/" className={estilos.primario}>
            Ir al catálogo
          </Link>
        </section>
      </main>
    </div>
  );
}
