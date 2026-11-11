import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapearProblema, validarEmail, validarPin } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { LayoutAuth } from "../componentes/LayoutAuth.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./auth.module.css";

const MINIMO = 8;

export function NuevaContrasena() {
  const { cliente } = useSesion();
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState({
    email: "",
    pin: "",
    nueva: "",
    repetir: "",
  });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  const cambiar = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);

    const problemas = {};
    const problemaEmail = validarEmail(formulario.email);
    if (problemaEmail) problemas.email = problemaEmail;
    const problemaPin = validarPin(formulario.pin);
    if (problemaPin) problemas.pin = problemaPin;
    if (formulario.nueva.length < MINIMO) {
      problemas.nueva = `La contraseña debe tener al menos ${MINIMO} caracteres.`;
    }
    if (formulario.repetir !== formulario.nueva) {
      problemas.repetir = "Las contraseñas no coinciden.";
    }

    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});

    setEnviando(true);
    try {
      await cliente.auth.confirmarRestablecimiento({
        email: formulario.email.trim(),
        pin: formulario.pin,
        nuevaContrasena: formulario.nueva,
      });
      setListo(true);
    } catch (fallo) {
      // El 422 es deliberadamente indistinguible: no se intenta adivinar la causa.
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <LayoutAuth
        titulo="Contraseña actualizada"
        subtitulo="Ya puedes entrar con tu nueva contraseña."
        resultado
        icono={{ nombre: "exito", tono: "exito" }}
      >
        <Boton onClick={() => navegar("/entrar")}>Entrar</Boton>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth
      titulo="Nueva contraseña"
      subtitulo="Escribe el código de 6 dígitos que enviamos a tu correo y elige una contraseña nueva."
    >
      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        {error && <Aviso>{error}</Aviso>}

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
          id="pin"
          etiqueta="Código"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          ayuda="Seis dígitos. Vence en 15 minutos y admite 5 intentos."
          value={formulario.pin}
          onChange={cambiar("pin")}
          error={errores.pin}
          required
        />

        <Campo
          id="nueva"
          etiqueta="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          ayuda="Mínimo 8 caracteres, sin reglas de composición."
          value={formulario.nueva}
          onChange={cambiar("nueva")}
          error={errores.nueva}
          required
        />

        <Campo
          id="repetir"
          etiqueta="Repetir contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={formulario.repetir}
          onChange={cambiar("repetir")}
          error={errores.repetir}
          required
        />

        <Boton type="submit" cargando={enviando}>
          {enviando ? "Guardando…" : "Guardar contraseña"}
        </Boton>
      </form>

      <p className={estilos.pie}>
        <Link to="/restablecer">Pedir otro código</Link>
      </p>
    </LayoutAuth>
  );
}
