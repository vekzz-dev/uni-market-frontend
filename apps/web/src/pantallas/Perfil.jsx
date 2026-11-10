import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  mapearProblema,
  resolverUrlMedia,
  validarAvatar,
} from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { CabeceraPublica } from "../componentes/CabeceraPublica.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { origenApi } from "../config.js";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./perfil.module.css";

export function Perfil() {
  const { cliente, sesion, estado, restaurado } = useSesion();
  const navegar = useNavigate();
  const autenticado = estado.estado === "autenticado";

  const [perfil, setPerfil] = useState(null);
  const [nombre, setNombre] = useState("");
  const [vista, setVista] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const [guardando, setGuardando] = useState(false);
  const [errorNombre, setErrorNombre] = useState(null);
  const [avisoNombre, setAvisoNombre] = useState(null);

  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState(null);
  const [avisoAvatar, setAvisoAvatar] = useState(null);

  const [contrasena, setContrasena] = useState({
    actual: "",
    nueva: "",
    repetir: "",
  });
  const [cambiando, setCambiando] = useState(false);
  const [errorContrasena, setErrorContrasena] = useState(null);
  const [avisoContrasena, setAvisoContrasena] = useState(null);

  const [dandoDeBaja, setDandoDeBaja] = useState(false);
  const [errorBaja, setErrorBaja] = useState(null);

  useEffect(() => {
    if (restaurado && !autenticado) navegar("/entrar", { replace: true });
  }, [autenticado, navegar, restaurado]);

  useEffect(() => {
    if (!autenticado) return undefined;
    let vigente = true;
    setVista("cargando");
    setErrorCarga(null);

    sesion
      .ejecutar(() => cliente.usuarios.leerPerfilPropio())
      .then((datos) => {
        if (!vigente) return;
        setPerfil(datos);
        setNombre(datos.nombre ?? "");
        setVista("listo");
      })
      .catch((fallo) => {
        if (!vigente) return;
        const problema = mapearProblema(fallo);
        if (problema.status === 401) navegar("/entrar", { replace: true });
        else {
          setErrorCarga(problema.mensaje);
          setVista("error");
        }
      });

    return () => {
      vigente = false;
    };
  }, [autenticado, cliente, navegar, recarga, sesion]);

  async function guardarNombre(evento) {
    evento.preventDefault();
    setErrorNombre(null);
    setAvisoNombre(null);
    if (!nombre.trim()) {
      setErrorNombre("Escribe tu nombre.");
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await sesion.ejecutar(() =>
        cliente.usuarios.actualizarPerfil({ nombre: nombre.trim() }),
      );
      setPerfil(actualizado);
      setNombre(actualizado.nombre);
      sesion.actualizarUsuario({
        nombre: actualizado.nombre,
        urlAvatar: actualizado.urlAvatar,
      });
      setAvisoNombre("Perfil actualizado.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorNombre(problema.mensaje);
    } finally {
      setGuardando(false);
    }
  }

  async function elegirAvatar(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setErrorAvatar(null);
    setAvisoAvatar(null);
    const problemaArchivo = validarAvatar(archivo);
    if (problemaArchivo) {
      setErrorAvatar(problemaArchivo);
      return;
    }
    setSubiendoAvatar(true);
    try {
      const actualizado = await sesion.ejecutar(() =>
        cliente.usuarios.subirAvatar(archivo),
      );
      setPerfil(actualizado);
      sesion.actualizarUsuario({ urlAvatar: actualizado.urlAvatar });
      setAvisoAvatar("Foto actualizada.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorAvatar(problema.mensaje);
    } finally {
      setSubiendoAvatar(false);
      evento.target.value = "";
    }
  }

  async function quitarAvatar() {
    setErrorAvatar(null);
    setAvisoAvatar(null);
    setSubiendoAvatar(true);
    try {
      await sesion.ejecutar(() => cliente.usuarios.eliminarAvatar());
      setPerfil((actual) => ({ ...actual, urlAvatar: null }));
      sesion.actualizarUsuario({ urlAvatar: null });
      setAvisoAvatar("Foto eliminada.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorAvatar(problema.mensaje);
    } finally {
      setSubiendoAvatar(false);
    }
  }

  async function cambiarContrasena(evento) {
    evento.preventDefault();
    setErrorContrasena(null);
    setAvisoContrasena(null);

    if (!contrasena.actual) {
      setErrorContrasena("Escribe tu contraseña actual.");
      return;
    }
    if (contrasena.nueva.length < 8) {
      setErrorContrasena("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (contrasena.nueva !== contrasena.repetir) {
      setErrorContrasena("Las contraseñas no coinciden.");
      return;
    }

    setCambiando(true);
    try {
      await sesion.ejecutar(() =>
        cliente.usuarios.cambiarContrasena({
          contrasenaActual: contrasena.actual,
          nuevaContrasena: contrasena.nueva,
        }),
      );
      setContrasena({ actual: "", nueva: "", repetir: "" });
      setAvisoContrasena("Contraseña actualizada.");
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorContrasena(problema.mensaje);
    } finally {
      setCambiando(false);
    }
  }

  async function darDeBaja() {
    if (
      !globalThis.confirm?.(
        "¿Dar de baja tu cuenta? Se deshabilita y tus anuncios dejan de verse. No se puede deshacer.",
      )
    )
      return;
    setErrorBaja(null);
    setDandoDeBaja(true);
    try {
      await sesion.ejecutar(() => cliente.usuarios.darDeBajaCuenta());
      await sesion.cerrarSesion();
      navegar("/", { replace: true });
    } catch (fallo) {
      const problema = mapearProblema(fallo);
      if (problema.status === 401) navegar("/entrar", { replace: true });
      else setErrorBaja(problema.mensaje);
    } finally {
      setDandoDeBaja(false);
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

  const avatar = perfil?.urlAvatar
    ? resolverUrlMedia(perfil.urlAvatar, origenApi)
    : null;
  const iniciales = (perfil?.nombre ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={estilos.pagina}>
      <CabeceraPublica
        onBuscar={(q) => navegar(q ? `/?q=${encodeURIComponent(q)}` : "/")}
      >
        <Link to="/mensajes" className={estilos.enlace}>
          Mensajes
        </Link>
      </CabeceraPublica>

      <main className={estilos.principal}>
        {vista === "cargando" && (
          <p className={estilos.estado} role="status">
            Cargando tu perfil…
          </p>
        )}

        {vista === "error" && (
          <div className={estilos.estadoError}>
            <Aviso>{errorCarga}</Aviso>
            <Boton
              variante="secundario"
              onClick={() => setRecarga((n) => n + 1)}
            >
              Reintentar
            </Boton>
          </div>
        )}

        {vista === "listo" && (
          <>
            <div className={estilos.encabezado}>
              <div>
                <h1 className={estilos.titulo}>Tu perfil</h1>
                <p className={estilos.subtitulo}>
                  Gestiona tus datos, tu foto y tu contraseña.
                </p>
              </div>
            </div>

            <section className={estilos.tarjeta} aria-labelledby="perfil-datos">
              <h2 id="perfil-datos" className={estilos.seccion}>
                Datos
              </h2>

              <div className={estilos.filaAvatar}>
                <div className={estilos.avatar}>
                  {avatar ? (
                    <img src={avatar} alt="" />
                  ) : (
                    <span aria-hidden="true">{iniciales || "?"}</span>
                  )}
                </div>
                <div className={estilos.accionesAvatar}>
                  <label className={estilos.botonArchivo} htmlFor="avatar">
                    {subiendoAvatar ? "Subiendo…" : "Cambiar foto"}
                  </label>
                  <input
                    id="avatar"
                    className={estilos.archivo}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    aria-label="Cambiar foto"
                    onChange={elegirAvatar}
                    disabled={subiendoAvatar}
                  />
                  {perfil?.urlAvatar && (
                    <Boton
                      variante="secundario"
                      className={estilos.accion}
                      disabled={subiendoAvatar}
                      onClick={quitarAvatar}
                    >
                      Eliminar
                    </Boton>
                  )}
                </div>
              </div>
              {errorAvatar && <Aviso>{errorAvatar}</Aviso>}
              {avisoAvatar && <Aviso tono="exito">{avisoAvatar}</Aviso>}

              <form className={estilos.formulario} onSubmit={guardarNombre}>
                <Campo
                  id="nombre"
                  etiqueta="Nombre"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  error={errorNombre ?? undefined}
                  required
                />
                <div className={estilos.campo}>
                  <label className={estilos.etiqueta} htmlFor="email">
                    Correo
                  </label>
                  <input
                    id="email"
                    className={estilos.soloLectura}
                    value={perfil?.email ?? ""}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
                {avisoNombre && <Aviso tono="exito">{avisoNombre}</Aviso>}
                <Boton type="submit" cargando={guardando}>
                  Guardar cambios
                </Boton>
              </form>
            </section>

            <section
              className={estilos.tarjeta}
              aria-labelledby="perfil-contrasena"
            >
              <h2 id="perfil-contrasena" className={estilos.seccion}>
                Contraseña
              </h2>
              <form
                className={estilos.formulario}
                onSubmit={cambiarContrasena}
                noValidate
              >
                <Campo
                  id="actual"
                  etiqueta="Contraseña actual"
                  type="password"
                  value={contrasena.actual}
                  onChange={(evento) =>
                    setContrasena((actual) => ({
                      ...actual,
                      actual: evento.target.value,
                    }))
                  }
                />
                <Campo
                  id="nueva"
                  etiqueta="Nueva contraseña"
                  type="password"
                  value={contrasena.nueva}
                  onChange={(evento) =>
                    setContrasena((actual) => ({
                      ...actual,
                      nueva: evento.target.value,
                    }))
                  }
                />
                <Campo
                  id="repetir"
                  etiqueta="Repetir contraseña"
                  type="password"
                  value={contrasena.repetir}
                  onChange={(evento) =>
                    setContrasena((actual) => ({
                      ...actual,
                      repetir: evento.target.value,
                    }))
                  }
                />
                {errorContrasena && <Aviso>{errorContrasena}</Aviso>}
                {avisoContrasena && (
                  <Aviso tono="exito">{avisoContrasena}</Aviso>
                )}
                <Boton variante="secundario" type="submit" cargando={cambiando}>
                  Cambiar contraseña
                </Boton>
              </form>
            </section>

            <section
              className={estilos.tarjeta}
              aria-labelledby="perfil-cuenta"
            >
              <h2 id="perfil-cuenta" className={estilos.seccion}>
                Cuenta
              </h2>
              <p className={estilos.texto}>
                Dar de baja tu cuenta la deshabilita y oculta tus anuncios.
              </p>
              {errorBaja && <Aviso>{errorBaja}</Aviso>}
              <Boton
                variante="peligro"
                className={estilos.peligro}
                cargando={dandoDeBaja}
                onClick={darDeBaja}
              >
                Dar de baja mi cuenta
              </Boton>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
