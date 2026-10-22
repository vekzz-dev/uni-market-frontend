import { Link, useNavigate } from 'react-router-dom';
import { Boton } from '../componentes/Boton.jsx';
import { useSesion } from '../sesion/SesionContexto.jsx';
import estilos from './inicio.module.css';

/**
 * Portada provisional de la entrega 1: el catálogo llega en la entrega 2.
 * Muestra el estado de sesión real para ejercitar el gestor de sesión.
 */
export function Inicio() {
  const { sesion, estado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === 'autenticado';

  async function salir() {
    await sesion.cerrarSesion();
    navegar('/entrar');
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecera}>
        <span className={estilos.marca}>
          <span className={estilos.logo} aria-hidden="true" />
          Uni Market
        </span>

        <nav className={estilos.acciones} aria-label="Cuenta">
          {autenticado ? (
            <>
              <span className={estilos.saludo}>Hola, {estado.usuario?.nombre}</span>
              <Boton variante="secundario" className={estilos.boton} onClick={salir}>
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
        </nav>
      </header>

      <main className={estilos.principal}>
        <section className={estilos.heroe} aria-labelledby="titulo-inicio">
          <p className={estilos.etiqueta}>Marketplace universitario</p>
          <h1 id="titulo-inicio" className={estilos.titulo}>
            Compra y vende dentro de tu universidad
          </h1>
          <p className={estilos.texto}>
            El catálogo de anuncios llega en la siguiente entrega. Mientras tanto, ya puedes crear tu
            cuenta, confirmar tu correo y entrar.
          </p>

          {!autenticado && (
            <div className={estilos.llamadas}>
              <Link to="/registro" className={estilos.primario}>
                Crear cuenta
              </Link>
              <Link to="/entrar" className={estilos.secundario}>
                Ya tengo cuenta
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
