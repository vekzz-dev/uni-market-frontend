import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Catalogo } from '../src/pantallas/Catalogo.jsx';
import { SesionContexto } from '../src/sesion/SesionContexto.jsx';

const categoria = { id: 3, nombre: 'Electrónica', orden: 1 };
const anuncio = (id, nombre) => ({
  id,
  nombre,
  precio: 45,
  categoriaId: 3,
  vendedorId: 'u1',
  fechaCreacion: new Date().toISOString(),
  imagenUrls: [],
});

function montar(buscarCatalogo, entrada = '/') {
  const cliente = {
    catalogo: { buscarCatalogo },
    categorias: { listarCategorias: vi.fn().mockResolvedValue({ datos: [categoria] }) },
  };
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <SesionContexto.Provider
        value={{ cliente, sesion: {}, estado: { estado: 'anonimo', usuario: null } }}
      >
        <Catalogo />
      </SesionContexto.Provider>
    </MemoryRouter>,
  );
}

describe('pantalla Catálogo', () => {
  it('carga la primera página y añade la siguiente sin duplicados', async () => {
    const usuario = userEvent.setup();
    const buscarCatalogo = vi
      .fn()
      .mockResolvedValueOnce({
        datos: [anuncio('a1', 'Calculadora')],
        paginacion: { cursorSiguiente: 'c2' },
      })
      .mockResolvedValueOnce({
        datos: [anuncio('a1', 'Calculadora'), anuncio('a2', 'Bicicleta')],
        paginacion: { cursorSiguiente: null },
      });
    montar(buscarCatalogo);

    expect(await screen.findByRole('heading', { name: 'Calculadora' })).toBeTruthy();
    await usuario.click(screen.getByRole('button', { name: 'Cargar más anuncios' }));

    expect(await screen.findByRole('heading', { name: 'Bicicleta' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'Calculadora' })).toHaveLength(1);
    expect(buscarCatalogo).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c2' }));
  });

  it('filtra por categoría y reinicia el cursor', async () => {
    const usuario = userEvent.setup();
    const buscarCatalogo = vi.fn().mockResolvedValue({
      datos: [],
      paginacion: { cursorSiguiente: null },
    });
    montar(buscarCatalogo);

    await screen.findByRole('button', { name: 'Electrónica' });
    await usuario.click(screen.getByRole('button', { name: 'Electrónica' }));

    expect(await screen.findByText('No encontramos anuncios')).toBeTruthy();
    expect(buscarCatalogo).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoriaId: 3 }),
    );
  });

  it('vacía el buscador al limpiar los filtros', async () => {
    const usuario = userEvent.setup();
    const buscarCatalogo = vi.fn().mockResolvedValue({
      datos: [],
      paginacion: { cursorSiguiente: null },
    });
    montar(buscarCatalogo, '/?q=algo');

    const buscador = await screen.findByRole('searchbox', { name: 'Buscar en el catálogo' });
    expect(buscador.value).toBe('algo');

    await usuario.click(await screen.findByRole('button', { name: 'Electrónica' }));
    await usuario.click(await screen.findByRole('button', { name: 'Limpiar filtros' }));

    expect(buscador.value).toBe('');
  });
});
