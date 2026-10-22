import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mapearProblema } from '@uni-market/core';
import { Aviso } from '../componentes/Aviso.jsx';
import { Boton } from '../componentes/Boton.jsx';
import { Campo } from '../componentes/Campo.jsx';
import { LayoutAuth } from '../componentes/LayoutAuth.jsx';
import { useSesion } from '../sesion/SesionContexto.jsx';
import estilos from './auth.module.css';

const MINIMO = 8;

export function NuevaContrasena() {
  const { cliente } = useSesion();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [formulario, setFormulario] = useState({ nueva: '', repetir: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(token ? 'formulario' : 'invalido');

  const cambiar = (campo) => (evento) =>
    setFormulario((actual) => ({ ...actual, [campo]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);

    const problemas = {};
    if (formulario.nueva.length < MINIMO) {
      problemas.nueva = `La contraseña debe tener al menos ${MINIMO} caracteres.`;
    }
    if (formulario.repetir !== formulario.nueva) {
      problemas.repetir = 'Las contraseñas no coinciden.';
    }
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas);
      return;
    }
    setErrores({});

    setEnviando(true);
    try {
      await cliente.auth.confirmarRestablecimiento({
        token,
        nuevaContrasena: formulario.nueva,
      });
      setEstado('listo');
    } catch (fallo) {
      const { mensaje, status } = mapearProblema(fallo);
      // El enlace es de un solo uso y vence en 60 minutos: un 4xx significa token inválido.
      if (status >= 400 && status < 500) {
        setEstado('invalido');
      } else {
        setError(mensaje);
      }
    } finally {
      setEnviando(false);
    }
  }

  if (estado === 'invalido') {
    return (
      <LayoutAuth
        titulo="El enlace no es válido"
        subtitulo="Puede que haya expirado o que ya se haya usado. Solicita uno nuevo."
        resultado
        icono={{ nombre: 'enlaceRoto', tono: 'error' }}
      >
        <Boton onClick={() => navegar('/restablecer')}>Solicitar enlace</Boton>
      </LayoutAuth>
    );
  }

  if (estado === 'listo') {
    return (
      <LayoutAuth
        titulo="Contraseña actualizada"
        subtitulo="Ya puedes entrar con tu nueva contraseña."
        resultado
        icono={{ nombre: 'exito', tono: 'exito' }}
      >
        <Boton onClick={() => navegar('/entrar')}>Entrar</Boton>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth
      titulo="Nueva contraseña"
      subtitulo="Elige una contraseña de al menos 8 caracteres."
    >
      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        {error && <Aviso>{error}</Aviso>}

        <Campo
          id="nueva"
          etiqueta="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          ayuda="Mínimo 8 caracteres, sin reglas de composición."
          value={formulario.nueva}
          onChange={cambiar('nueva')}
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
          onChange={cambiar('repetir')}
          error={errores.repetir}
          required
        />

        <Boton type="submit" cargando={enviando}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </Boton>
      </form>
    </LayoutAuth>
  );
}
