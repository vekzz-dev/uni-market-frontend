import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Inicio } from '../src/pantallas/Inicio.jsx';
import { SesionContexto } from '../src/sesion/SesionContexto.jsx';

function montar(estado, cerrarSesion = vi.fn().mockResolvedValue(undefined)) {
  return render(
    <MemoryRouter>
      <SesionContexto.Provider value={{ cliente: {}, sesion: { cerrarSesion }, estado }}>
        <Inicio />
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

describe('pantalla Inicio', () => {
  it('invita a crear cuenta cuando no hay sesión', () => {
    montar({ estado: 'anonimo', usuario: null });

    expect(screen.getAllByRole('link', { name: 'Crear cuenta' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
  });

  it('saluda y permite cerrar sesión cuando está autenticado', () => {
    montar({ estado: 'autenticado', usuario: { nombre: 'Ana' } });

    expect(screen.getByText('Hola, Ana')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).toBeNull();
  });
});
