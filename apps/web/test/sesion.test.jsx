import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SesionProvider, useSesion } from '../src/sesion/SesionContexto.jsx';

function Sonda() {
  const { estado } = useSesion();
  return <p>estado: {estado.estado}</p>;
}

describe('SesionProvider', () => {
  it('arranca en anónimo cuando no hay refresh guardado', async () => {
    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );

    expect(await screen.findByText('estado: anonimo')).toBeTruthy();
  });
});
