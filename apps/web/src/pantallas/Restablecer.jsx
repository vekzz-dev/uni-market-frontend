import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapearProblema } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { LayoutAuth } from "../componentes/LayoutAuth.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./auth.module.css";

export function Restablecer() {
  const { cliente } = useSesion();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await cliente.auth.solicitarRestablecimiento({ email });
      setEnviado(true);
    } catch (fallo) {
      const { mensaje, status } = mapearProblema(fallo);
      setError(mensaje);
      if (status === 429) setBloqueado(true);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <LayoutAuth
        titulo="Revisa tu correo"
        subtitulo="Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña. Vence en 60 minutos."
        resultado
        icono={{ nombre: "correo", tono: "exito" }}
      >
        <Boton variante="secundario" onClick={() => navegar("/entrar")}>
          Volver a entrar
        </Boton>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth
      titulo="Restablecer contraseña"
      subtitulo="Te enviaremos un enlace para crear una nueva."
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

        <Boton type="submit" cargando={enviando} disabled={bloqueado}>
          {enviando ? "Enviando…" : "Enviar enlace"}
        </Boton>
      </form>

      <p className={estilos.pie}>
        <Link to="/entrar">Volver a entrar</Link>
      </p>
    </LayoutAuth>
  );
}
