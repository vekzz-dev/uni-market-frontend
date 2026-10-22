import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '@uni-market/api-client';
import { Registro } from '../src/pantallas/Registro.jsx';
import { SesionContexto } from '../src/sesion/SesionContexto.jsx';

function montar(registrarUsuario) {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <SesionContexto.Provider
        value={{
          cliente: { usuarios: { registrarUsuario } },
          sesion: {},
          estado: { estado: 'anonimo', usuario: null },
        }}
      >
        <Registro />
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

describe('pantalla Registro', () => {
  it('valida en el cliente antes de llamar a la API', async () => {
    const usuario = userEvent.setup();
    const registrarUsuario = vi.fn();
    montar(registrarUsuario);

    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByText('Escribe tu nombre.')).toBeTruthy();
    expect(screen.getByText('Escribe tu correo.')).toBeTruthy();
    expect(screen.getByText('La contraseña necesita al menos 8 caracteres.')).toBeTruthy();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra el 409 del correo duplicado sin abrir sesión', async () => {
    const usuario = userEvent.setup();
    const registrarUsuario = vi
      .fn()
      .mockRejectedValue(new ApiError('Conflicto', { status: 409 }));
    montar(registrarUsuario);

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Correo'), 'ana@uni.edu');
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    const aviso = await screen.findByRole('alert');
    expect(aviso.textContent).toContain('Ya existe un registro con esos datos.');
    expect(screen.queryByRole('heading', { name: 'Revisa tu correo' })).toBeNull();
  });

  it('no navega ni abre sesión cuando el registro se completa', async () => {
    const usuario = userEvent.setup();
    const registrarUsuario = vi.fn().mockResolvedValue({});
    montar(registrarUsuario);

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana');
    await usuario.type(screen.getByLabelText('Correo'), 'ana@uni.edu');
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeTruthy();
  });
});
