import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  mapearProblema,
  validarImagenes,
  validarPrecio,
} from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./publicar.module.css";

export function Publicar() {
  const { cliente, sesion, estado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === "autenticado";

  const [categorias, setCategorias] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    categoriaId: "",
  });
  const [archivos, setArchivos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [publicado, setPublicado] = useState(false);

  useEffect(() => {
    if (!autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar]);

  useEffect(() => {
    cliente.categorias
      .listarCategorias()
      .then((r) => setCategorias(r.datos ?? []))
      .catch(() => setCategorias([]));
  }, [cliente]);

  useEffect(() => {
    if (typeof URL.createObjectURL !== "function") {
      setPreviews([]);
      return undefined;
    }
    const urls = archivos.map((archivo) => URL.createObjectURL(archivo));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [archivos]);

  const cambiar = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }));

  function elegirArchivos(evento) {
    setArchivos(Array.from(evento.target.files ?? []));
    setErrores((actuales) => ({ ...actuales, imagenes: undefined }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);

    const problemas = {};
    if (!formulario.nombre.trim()) problemas.nombre = "Escribe un nombre.";
    const precioError = validarPrecio(formulario.precio);
    if (precioError) problemas.precio = precioError;
    const imagenesError = validarImagenes(archivos);
    if (imagenesError) problemas.imagenes = imagenesError;

    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});

    setEnviando(true);
    try {
      await sesion.ejecutar(() =>
        cliente.anuncios.crearAnuncio(
          formulario.nombre.trim(),
          Number(formulario.precio),
          archivos,
          {
            descripcion: formulario.descripcion.trim() || undefined,
            categoriaId: formulario.categoriaId
              ? Number(formulario.categoriaId)
              : undefined,
          },
        ),
      );
      setPublicado(true);
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
        <main className={estilos.principal}>
          <section
            className={estilos.tarjeta}
            aria-labelledby="titulo-publicar"
          >
            <h1 id="titulo-publicar" className={estilos.titulo}>
              Inicia sesión para publicar
            </h1>
            <p className={estilos.subtitulo}>
              Necesitas una cuenta para publicar anuncios y gestionarlos.
            </p>
            <Link to="/entrar" className={estilos.primario}>
              Entrar
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (publicado) {
    return (
      <div className={estilos.pagina}>
        <CabeceraPublica
          onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
        />
        <main className={estilos.principal}>
          <section
            className={estilos.tarjeta}
            aria-labelledby="titulo-publicado"
          >
            <div className={estilos.icono} aria-hidden="true">
              ✓
            </div>
            <h1 id="titulo-publicado" className={estilos.titulo}>
              Anuncio publicado
            </h1>
            <p className={estilos.subtitulo}>
              Queda pendiente de revisión. Cuando se apruebe, aparecerá en el
              catálogo.
            </p>
            <Link to="/" className={estilos.primario}>
              Volver al catálogo
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
          <h1 className={estilos.titulo}>Publicar anuncio</h1>
          <p className={estilos.subtitulo}>
            Todo anuncio pasa por revisión antes de publicarse.
          </p>
        </div>

        <div className={estilos.columnas}>
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
                placeholder="Estado, accesorios y detalles que ayuden a decidir."
              />
            </div>

            <div className={estilos.campo}>
              <span className={estilos.etiqueta} id="imagenes-etiqueta">
                Imágenes
              </span>
              <label className={estilos.dropzone} htmlFor="imagenes">
                <input
                  id="imagenes"
                  className={estilos.archivo}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  aria-label="Imágenes"
                  aria-describedby="imagenes-ayuda"
                  onChange={elegirArchivos}
                />
                <span aria-hidden="true">↑</span>
                <strong>Arrastra o elige hasta 5 imágenes</strong>
                <span id="imagenes-ayuda">
                  JPG, PNG, GIF o WEBP · máximo 5 MB cada una
                </span>
              </label>
              {errores.imagenes && (
                <p className={estilos.error}>{errores.imagenes}</p>
              )}
              {previews.length > 0 && (
                <ul className={estilos.miniaturas}>
                  {previews.map((url, posicion) => (
                    <li key={url}>
                      <img src={url} alt={`Imagen ${posicion + 1}`} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={estilos.acciones}>
              <Link to="/" className={estilos.secundario}>
                Cancelar
              </Link>
              <Boton type="submit" cargando={enviando}>
                {enviando ? "Publicando…" : "Publicar anuncio"}
              </Boton>
            </div>
          </form>

          <aside className={estilos.ayuda}>
            <h2 className={estilos.ayudaTitulo}>Antes de publicar</h2>
            <p>• Todo anuncio nace pendiente y pasa por revisión.</p>
            <p>• De 1 a 5 imágenes, máximo 5 MB cada una.</p>
            <p>• Si lo editas después, vuelve a revisión.</p>
            <p>• Solo tú puedes editarlo, ocultarlo o marcarlo vendido.</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
