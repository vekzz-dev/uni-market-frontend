import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '@uni-market/api-client';
import { Entrar } from '../src/pantallas/Entrar.jsx';
import { SesionContexto } from '../src/sesion/SesionContexto.jsx';

function montar(sesion) {
  return render(
    <MemoryRouter initialEntries={['/entrar']}>
      <SesionContexto.Provider
        value={{ cliente: {}, sesion, estado: { estado: 'anonimo', usuario: null } }}
      >
        <Routes>
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/" element={<h1>Catálogo</h1>} />
        </Routes>
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

async function completar(usuario) {
  await usuario.type(screen.getByLabelText('Correo'), 'ana@uni.edu');
  await usuario.type(screen.getByLabelText('Contraseña'), 'secreta123');
}

describe('pantalla Entrar', () => {
  it('entra y navega al catálogo cuando la sesión se inicia', async () => {
    const usuario = userEvent.setup();
    const iniciarSesion = vi.fn().mockResolvedValue({});
    montar({ iniciarSesion });

    await completar(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(iniciarSesion).toHaveBeenCalledWith({ email: 'ana@uni.edu', contrasena: 'secreta123' });
    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeTruthy();
  });

  it('muestra el mensaje del 401 sin distinguir la causa', async () => {
    const usuario = userEvent.setup();
    const iniciarSesion = vi
      .fn()
      .mockRejectedValue(new ApiError('No autorizado', { status: 401 }));
    montar({ iniciarSesion });

    await completar(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    const aviso = await screen.findByRole('alert');
    expect(aviso.textContent).toContain('Tu sesión terminó. Inicia sesión de nuevo.');
  });

  it('bloquea el envío tras un 429, sin cuenta atrás inventada', async () => {
    const usuario = userEvent.setup();
    const iniciarSesion = vi
      .fn()
      .mockRejectedValue(new ApiError('Demasiados intentos', { status: 429 }));
    montar({ iniciarSesion });

    await completar(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }));

    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Entrar' }).disabled).toBe(true);
  });
});
