import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapearProblema, validarRegistro } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { LayoutAuth } from "../componentes/LayoutAuth.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./auth.module.css";

export function Registro() {
  const { cliente } = useSesion();
  const navegar = useNavigate();
  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    contrasena: "",
  });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const cambiar = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);

    const problemas = validarRegistro(formulario);
    if (problemas.length > 0) {
      setErrores(
        Object.fromEntries(problemas.map((p) => [p.campo, p.mensaje])),
      );
      return;
    }
    setErrores({});

    setEnviando(true);
    try {
      await cliente.usuarios.registrarUsuario(formulario);
      setEnviado(true);
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <LayoutAuth
        titulo="Revisa tu correo"
        subtitulo={`Te enviamos un enlace de confirmación a ${formulario.email}. Vence en 24 horas.`}
        resultado
        icono={{ nombre: "correo", tono: "exito" }}
      >
        <Boton variante="secundario" onClick={() => navegar("/entrar")}>
          Ir a entrar
        </Boton>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth
      titulo="Crear cuenta"
      subtitulo="Publica y conversa en el marketplace universitario."
    >
      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        {error && <Aviso>{error}</Aviso>}

        <Campo
          id="nombre"
          etiqueta="Nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          value={formulario.nombre}
          onChange={cambiar("nombre")}
          error={errores.nombre}
          required
        />

        <Campo
          id="correo"
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={formulario.email}
          onChange={cambiar("email")}
          error={errores.email}
          required
        />

        <Campo
          id="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          ayuda="Mínimo 8 caracteres."
          value={formulario.contrasena}
          onChange={cambiar("contrasena")}
          error={errores.contrasena}
          required
        />

        <Boton type="submit" cargando={enviando}>
          {enviando ? "Creando cuenta…" : "Crear cuenta"}
        </Boton>
      </form>

      <div className={estilos.separador} />

      <p className={estilos.pie}>
        <span>¿Ya tienes cuenta?</span>
        <Link to="/entrar">Entrar</Link>
      </p>
    </LayoutAuth>
  );
}
