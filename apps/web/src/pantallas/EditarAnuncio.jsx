import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { mapearProblema, validarPrecio } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./publicar.module.css";

export function EditarAnuncio() {
  const { id } = useParams();
  const { state } = useLocation();
  const { cliente, sesion, estado } = useSesion();
  const navegar = useNavigate();
  const anuncio = state?.anuncio;
  const autenticado = estado.estado === "autenticado";

  const [categorias, setCategorias] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: anuncio?.nombre ?? "",
    precio: anuncio?.precio != null ? String(anuncio.precio) : "",
    descripcion: anuncio?.descripcion ?? "",
    categoriaId:
      anuncio?.categoriaId != null ? String(anuncio.categoriaId) : "",
  });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar]);

  useEffect(() => {
    cliente.categorias
      .listarCategorias()
      .then((r) => setCategorias(r.datos ?? []))
      .catch(() => setCategorias([]));
  }, [cliente]);

  const cambiar = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);

    const problemas = {};
    if (!formulario.nombre.trim()) problemas.nombre = "Escribe un nombre.";
    const precioError = validarPrecio(formulario.precio);
    if (precioError) problemas.precio = precioError;
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});

    setEnviando(true);
    try {
      await sesion.ejecutar(() =>
        cliente.anuncios.editarAnuncio(id, {
          nombre: formulario.nombre.trim(),
          precio: Number(formulario.precio),
          descripcion: formulario.descripcion.trim() || undefined,
          categoriaId: formulario.categoriaId
            ? Number(formulario.categoriaId)
            : undefined,
        }),
      );
      setGuardado(true);
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setError(problema.mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (!autenticado) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
      </div>
    );
  }

  if (!anuncio) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
        <main className={estilos.principal}>
          <section className={estilos.tarjeta} aria-labelledby="titulo-editar">
            <h1 id="titulo-editar" className={estilos.titulo}>
              No pudimos abrir el anuncio
            </h1>
            <p className={estilos.subtitulo}>
              Vuelve a tu panel y elige el anuncio de nuevo.
            </p>
            <Link to="/mis-anuncios" className={estilos.primario}>
              Ir a mis anuncios
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (guardado) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
        <main className={estilos.principal}>
          <section
            className={estilos.tarjeta}
            aria-labelledby="titulo-guardado"
          >
            <div className={estilos.icono} aria-hidden="true">
              ✓
            </div>
            <h1 id="titulo-guardado" className={estilos.titulo}>
              Anuncio actualizado
            </h1>
            <p className={estilos.subtitulo}>
              Los cambios vuelven a revisión. Cuando se aprueben, se verán en el
              catálogo.
            </p>
            <Link to="/mis-anuncios" className={estilos.primario}>
              Volver a mis anuncios
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      />
      <main className={estilos.principal}>
        <div className={estilos.encabezado}>
          <h1 className={estilos.titulo}>Editar anuncio</h1>
          <p className={estilos.subtitulo}>
            Al guardar, el anuncio vuelve a revisión. Las imágenes se editan por
            separado.
          </p>
        </div>

        <form className={estilos.formulario} onSubmit={enviar} noValidate>
          {error && <Aviso>{error}</Aviso>}

          <Campo
            id="nombre"
            etiqueta="Nombre"
            value={formulario.nombre}
            onChange={cambiar("nombre")}
            error={errores.nombre}
            required
          />
          <Campo
            id="precio"
            etiqueta="Precio (USD)"
            inputMode="decimal"
            value={formulario.precio}
            onChange={cambiar("precio")}
            error={errores.precio}
            required
          />

          <div className={estilos.campo}>
            <label className={estilos.etiqueta} htmlFor="categoria">
              Categoría
            </label>
            <select
              id="categoria"
              className={estilos.selector}
              value={formulario.categoriaId}
              onChange={cambiar("categoriaId")}
            >
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className={estilos.campo}>
            <label className={estilos.etiqueta} htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className={estilos.textarea}
              value={formulario.descripcion}
              onChange={cambiar("descripcion")}
            />
          </div>

          <div className={estilos.acciones}>
            <Link to="/mis-anuncios" className={estilos.secundario}>
              Cancelar
            </Link>
            <Boton type="submit" cargando={enviando}>
              {enviando ? "Guardando…" : "Guardar cambios"}
            </Boton>
          </div>
        </form>
      </main>
    </div>
  );
}
