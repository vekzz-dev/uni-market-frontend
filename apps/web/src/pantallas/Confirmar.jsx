import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mapearProblema, validarEmail, validarPin } from "@uni-market/core";
import { Aviso } from "../componentes/Aviso.jsx";
import { Boton } from "../componentes/Boton.jsx";
import { Campo } from "../componentes/Campo.jsx";
import { LayoutAuth } from "../componentes/LayoutAuth.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";
import estilos from "./auth.module.css";

export function Confirmar() {
  const { cliente } = useSesion();
  const navegar = useNavigate();
  const [formulario, setFormulario] = useState({ email: "", pin: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

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

    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});

    setEnviando(true);
    try {
      await cliente.auth.confirmarEmail({
        email: formulario.email.trim(),
        pin: formulario.pin,
      });
      setConfirmado(true);
    } catch (fallo) {
      setError(mapearProblema(fallo).mensaje);
    } finally {
      setEnviando(false);
    }
  }

  if (confirmado) {
    return (
      <LayoutAuth
        titulo="Cuenta confirmada"
        subtitulo="Ya puedes entrar y publicar tus anuncios."
        resultado
        icono={{ nombre: "exito", tono: "exito" }}
      >
        <Boton onClick={() => navegar("/entrar")}>Entrar</Boton>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth
      titulo="Confirma tu cuenta"
      subtitulo="Escribe el código de 6 dígitos que enviamos a tu correo."
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

        <Boton type="submit" cargando={enviando}>
          {enviando ? "Confirmando…" : "Confirmar cuenta"}
        </Boton>
      </form>

      <p className={estilos.pie}>
        <Link to="/reenviar">Reenviar el código</Link>
      </p>
    </LayoutAuth>
  );
}
