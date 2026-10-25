import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { Catalogo } from '../src/pantallas/Catalogo.jsx';
import { SesionContexto } from '../src/sesion/SesionContexto.jsx';

const categoria = { id: 3, nombre: 'Electrónica', orden: 1 };
const categoriaLibros = { id: 4, nombre: 'Libros', orden: 2 };
const anuncio = (id, nombre) => ({
  id,
  nombre,
  precio: 45,
  categoriaId: 3,
  vendedorId: 'u1',
  vendedorNombre: 'Ana P.',
  fechaCreacion: new Date().toISOString(),
  imagenUrls: [],
});

function Sonda() {
  const { search } = useLocation();
  return <p data-testid="ubicacion">{search}</p>;
}

function montar(buscarCatalogo, entrada = '/') {
  const cliente = {
    catalogo: { buscarCatalogo },
    categorias: { listarCategorias: vi.fn().mockResolvedValue({ datos: [categoria, categoriaLibros] }) },
  };
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <SesionContexto.Provider
        value={{ cliente, sesion: {}, estado: { estado: 'anonimo', usuario: null } }}
      >
        <Catalogo />
        <Sonda />
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
    expect(screen.getByText(/Ana P\./)).toBeTruthy();
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

  it('escribe la búsqueda en la URL', async () => {
    const usuario = userEvent.setup();
    const buscarCatalogo = vi.fn().mockResolvedValue({
      datos: [],
      paginacion: { cursorSiguiente: null },
    });
    montar(buscarCatalogo);

    const buscador = await screen.findByRole('searchbox', { name: 'Buscar en el catálogo' });
    await usuario.type(buscador, 'bici');
    await usuario.keyboard('{Enter}');

    expect((await screen.findByTestId('ubicacion')).textContent).toBe('?q=bici');
    expect(buscarCatalogo).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'bici' }));
  });

  it('muestra el error inicial y reintenta', async () => {
    const usuario = userEvent.setup();
    const buscarCatalogo = vi
      .fn()
      .mockRejectedValueOnce(new Error('sin red'))
      .mockResolvedValueOnce({
        datos: [anuncio('a1', 'Calculadora')],
        paginacion: { cursorSiguiente: null },
      });
    montar(buscarCatalogo);

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos conectar');
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Calculadora' })).toBeTruthy();
  });

  it('avisa del error al cargar más sin perder la página actual', async () => {
    const usuario = userEvent.setup();
    const buscarCatalogo = vi
      .fn()
      .mockResolvedValueOnce({
        datos: [anuncio('a1', 'Calculadora')],
        paginacion: { cursorSiguiente: 'c2' },
      })
      .mockRejectedValueOnce(new Error('sin red'));
    montar(buscarCatalogo);

    await screen.findByRole('heading', { name: 'Calculadora' });
    await usuario.click(screen.getByRole('button', { name: 'Cargar más anuncios' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos conectar');
    expect(screen.getByRole('heading', { name: 'Calculadora' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cargar más anuncios' })).toBeTruthy();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const buscarCatalogo = vi.fn().mockResolvedValue({
      datos: [anuncio('a1', 'Calculadora')],
      paginacion: { cursorSiguiente: null },
    });
    const { container } = montar(buscarCatalogo);

    await screen.findByRole('heading', { name: 'Calculadora' });
    expect((await axe(container)).violations).toEqual([]);
  });

  it('conserva los resultados si falla la recarga por filtro', async () => {
    const usuario = userEvent.setup();
    const buscarCatalogo = vi
      .fn()
      .mockResolvedValueOnce({
        datos: [anuncio('a1', 'Calculadora')],
        paginacion: { cursorSiguiente: null },
      })
      .mockRejectedValueOnce(new Error('sin red'));
    montar(buscarCatalogo);

    await screen.findByRole('heading', { name: 'Calculadora' });
    await usuario.click(screen.getByRole('button', { name: 'Electrónica' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos conectar');
    expect(screen.getByRole('heading', { name: 'Calculadora' })).toBeTruthy();
  });

  it('ignora la respuesta de un filtro anterior', async () => {
    const usuario = userEvent.setup();
    let resolverLenta;
    let resolverRapida;
    const lenta = new Promise((resolve) => {
      resolverLenta = resolve;
    });
    const rapida = new Promise((resolve) => {
      resolverRapida = resolve;
    });
    const buscarCatalogo = vi
      .fn()
      .mockResolvedValueOnce({
        datos: [anuncio('a1', 'Calculadora')],
        paginacion: { cursorSiguiente: null },
      })
      .mockReturnValueOnce(lenta)
      .mockReturnValueOnce(rapida);
    montar(buscarCatalogo);

    await screen.findByRole('heading', { name: 'Calculadora' });
    await usuario.click(screen.getByRole('button', { name: 'Electrónica' }));
    await usuario.click(screen.getByRole('button', { name: 'Libros' }));

    await act(async () => {
      resolverRapida({
        datos: [anuncio('c1', 'Libro C')],
        paginacion: { cursorSiguiente: null },
      });
    });
    expect(await screen.findByRole('heading', { name: 'Libro C' })).toBeTruthy();

    await act(async () => {
      resolverLenta({
        datos: [anuncio('b1', 'Electrónica B')],
        paginacion: { cursorSiguiente: null },
      });
    });

    expect(screen.queryByRole('heading', { name: 'Electrónica B' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Libro C' })).toBeTruthy();
  });
});
