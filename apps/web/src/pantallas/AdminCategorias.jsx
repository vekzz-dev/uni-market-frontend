import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapearProblema, puede } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./admin.module.css";

const VACIO = { nombre: "", descripcion: "", icono: "" };

export function AdminCategorias() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === "autenticado";
  const puedeGestionar = puede(estado.usuario?.rol, "categorias.gestionar");

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const [formulario, setFormulario] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar, restaurado]);

  useEffect(() => {
    if (!autenticado || !puedeGestionar) return undefined;
    let vigente = true;
    setCargando(true);
    setError(null);

    sesion
      .ejecutar(() => cliente.categorias.listarCategorias())
      .then((respuesta) => {
        if (!vigente) return;
        setCategorias(respuesta.datos ?? []);
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
  }, [autenticado, cliente, navegar, puedeGestionar, recarga, sesion]);

  function abrirAlta() {
    setFormulario({ ...VACIO });
    setErrorFormulario(null);
    setAviso(null);
  }

  function abrirEdicion(categoria) {
    setFormulario({
      id: categoria.id,
      nombre: categoria.nombre ?? "",
      descripcion: categoria.descripcion ?? "",
      icono: categoria.icono ?? "",
    });
    setErrorFormulario(null);
    setAviso(null);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setErrorFormulario(null);
    setAviso(null);

    if (!formulario.nombre.trim()) {
      setErrorFormulario("Escribe el nombre de la categoría.");
      return;
    }

    const cuerpo = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      icono: formulario.icono.trim() || null,
    };

    setGuardando(true);
    try {
      if (formulario.id) {
        await sesion.ejecutar(() =>
          cliente.categorias.actualizarCategoria(formulario.id, cuerpo),
        );
        setAviso("Categoría actualizada.");
      } else {
        await sesion.ejecutar(() => cliente.categorias.crearCategoria(cuerpo));
        setAviso("Categoría creada.");
      }
      setFormulario(null);
      setRecarga((n) => n + 1);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else if (problema.status === 409)
        setErrorFormulario("Ya existe una categoría con ese nombre.");
      else setErrorFormulario(problema.mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(categoria) {
    if (
      !globalThis.confirm?.(
        `¿Eliminar la categoría "${categoria.nombre}"? Los anuncios de esa categoría quedan sin categoría.`,
      )
    )
      return;
    setErrorAccion(null);
    setAviso(null);
    try {
      await sesion.ejecutar(() =>
        cliente.categorias.eliminarCategoria(categoria.id),
      );
      setAviso("Categoría eliminada.");
      setRecarga((n) => n + 1);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorAccion(problema.mensaje);
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

  if (!puedeGestionar) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
        <main className={estilos.principal}>
          <div className={estilos.sinAcceso}>
            <h1 className={estilos.titulo}>No tienes acceso a categorías</h1>
            <p className={estilos.subtitulo}>
              Esta sección es para moderadores. Vuelve al catálogo.
            </p>
            <Link to="/" className={estilos.primario}>
              Ir al catálogo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      >
        {puede(estado.usuario?.rol, "admin.usuarios") && (
          <Link to="/admin/usuarios" className={estilos.enlace}>
            Usuarios
          </Link>
        )}
        <Link to="/moderacion" className={estilos.enlace}>
          Moderación
        </Link>
      </CabeceraPublica>

      <main className={estilos.principal}>
        <div className={estilos.encabezado}>
          <div>
            <h1 className={estilos.titulo}>Categorías</h1>
            <p className={estilos.subtitulo}>
              Orden y descripción del catálogo.
            </p>
          </div>
          <Boton className={estilos.principalAccion} onClick={abrirAlta}>
            Nueva categoría
          </Boton>
        </div>

        {aviso && <Aviso tono="exito">{aviso}</Aviso>}
        {errorAccion && <Aviso>{errorAccion}</Aviso>}

        {formulario && (
          <form className={estilos.formulario} onSubmit={guardar} noValidate>
            <h2 className={estilos.seccion}>
              {formulario.id ? "Editar categoría" : "Nueva categoría"}
            </h2>
            <div className={estilos.campos}>
              <Campo
                id="categoria-nombre"
                etiqueta="Nombre"
                value={formulario.nombre}
                onChange={(evento) =>
                  setFormulario((actual) => ({
                    ...actual,
                    nombre: evento.target.value,
                  }))
                }
                error={errorFormulario ?? undefined}
                required
              />
              <Campo
                id="categoria-icono"
                etiqueta="Icono"
                value={formulario.icono}
                onChange={(evento) =>
                  setFormulario((actual) => ({
                    ...actual,
                    icono: evento.target.value,
                  }))
                }
              />
            </div>
            <Campo
              id="categoria-descripcion"
              etiqueta="Descripción"
              value={formulario.descripcion}
              onChange={(evento) =>
                setFormulario((actual) => ({
                  ...actual,
                  descripcion: evento.target.value,
                }))
              }
            />
            <div className={estilos.acciones}>
              <Boton
                variante="secundario"
                className={estilos.accion}
                onClick={() => setFormulario(null)}
              >
                Cancelar
              </Boton>
              <Boton
                className={estilos.accion}
                type="submit"
                cargando={guardando}
              >
                Guardar categoría
              </Boton>
            </div>
          </form>
        )}

        {cargando && (
          <p className={estilos.estado} role="status">
            Cargando categorías…
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

        {!cargando && !error && (
          <ul className={estilos.lista}>
            {categorias.map((categoria) => (
              <li key={categoria.id} className={estilos.fila}>
                <span className={estilos.orden} aria-hidden="true">
                  {categoria.orden ?? "—"}
                </span>
                <div className={estilos.datos}>
                  <p className={estilos.nombre}>{categoria.nombre}</p>
                  <p className={estilos.meta}>
                    {categoria.descripcion ?? "Sin descripción"}
                  </p>
                </div>
                <div className={estilos.acciones}>
                  <Boton
                    variante="secundario"
                    className={estilos.accion}
                    onClick={() => abrirEdicion(categoria)}
                  >
                    Editar
                  </Boton>
                  <Boton
                    variante="secundario"
                    className={estilos.accion}
                    onClick={() => eliminar(categoria)}
                  >
                    Eliminar
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
