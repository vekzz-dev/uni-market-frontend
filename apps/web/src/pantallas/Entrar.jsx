import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapearProblema } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { LayoutAuth } from "../componentes/LayoutAuth.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./auth.module.css";

export function Entrar() {
  const { sesion } = useSesion();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await sesion.iniciarSesion({ email, contrasena });
      navegar("/");
    } catch (fallo) {
      const { mensaje, status } = mapearProblema(fallo);
      setError(mensaje);
      // Sin Retry-After en el contrato: se bloquea el envío, sin cuenta atrás inventada.
      if (status === 429) setBloqueado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth
      titulo="Entrar"
      subtitulo="Accede a tu cuenta para publicar y conversar."
    >
      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        {error && <Aviso>{error}</Aviso>}

        <Campo
          id="correo"
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          required
        />

        <Campo
          id="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          required
        />

        <div className={estilos.olvide}>
          <Link to="/restablecer">¿Olvidaste tu contraseña?</Link>
        </div>

        <Boton type="submit" cargando={enviando} disabled={bloqueado}>
          {enviando ? "Entrando…" : "Entrar"}
        </Boton>
      </form>

      <div className={estilos.separador} />

      <div className={estilos.pieGrupo}>
        <p className={estilos.pie}>
          <span>¿No tienes cuenta?</span>
          <Link to="/registro">Crear cuenta</Link>
        </p>
        <p className={estilos.pie}>
          <span>¿No confirmaste tu correo?</span>
          <Link to="/reenviar">Reenviar</Link>
        </p>
      </div>
    </LayoutAuth>
  );
}
