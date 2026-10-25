# Inc 2 — Catálogo y detalle web

**Objetivo**: catálogo público navegable (cursor + "Cargar más") y detalle de un anuncio visible, sobre el contrato de `uni-market-api`.
**Rama**: `feat/inc-2-catalogo` · **Runner**: `pnpm --filter @uni-market/web test`
**Diseño**: `design/uni-market.fig` páginas `01 · Catálogo` y `08 · Detalle`; previews en `design/preview/`.

## Specs

- **S1 — Catálogo público.** La ruta `/` consume `GET /v1/anuncios` (`buscarCatalogo`) con `q`, `categoriaId`, `cursor`, `limite` y `orden`. El contrato devuelve `{ datos, paginacion: { cursorSiguiente } }`: **no hay total**; el botón dice "Cargar más anuncios" y se oculta cuando `cursorSiguiente` es `null`.
- **S2 — Tarjeta de anuncio.** Muestra imagen (primera de `imagenUrls`, resuelta al origen de medios), nombre, precio en USD (`formatearPrecio`), categoría resuelta por `categoriaId` y fecha relativa (`formatearFechaRelativa`). Muestra el **nombre público del vendedor** (`vendedorNombre`, R17): nombre de pila + inicial del apellido calculado por el servidor; el nombre completo nunca viaja.
- **S3 — Estados del catálogo.** Cargando (esqueleto o texto), vacío ("No encontramos anuncios" con la acción de limpiar filtros), error de red (aviso + "Reintentar"). Un `400` de estructura se trata como error visible, no como vacío.
- **S4 — Filtros.** Chips de categoría desde `GET /v1/categorias`, orden "Más recientes" (`fechaCreacion`) / "Menor precio" (`precio`) y búsqueda por `q` al enviar. Cambiar cualquier filtro reinicia el cursor y vuelve a la primera página.
- **S5 — Detalle.** `/anuncios/:id` consume `GET /v1/anuncios/{id}` (`leerAnuncio`). Un `404` es indistinguible (R4): se muestra "Este anuncio ya no está disponible". La galería usa las `imagenUrls`; el CTA "Contactar" pide iniciar sesión (la mensajería llega en el Inc 5).
- **S6 — Reglas transversales.** Sin `fetch` a mano: todo pasa por `@uni-market/api-client`. Precio y fechas con `@uni-market/core`. Español en el copy, USD con `$`, WCAG 2.2 AA.

## Tareas

- [x] **T1 — Catálogo en `/`**: reemplaza la portada provisional por la grilla, los filtros y "Cargar más" (cursor). Ruta: padre.
- [x] **T2 — Pruebas del catálogo**: primera página, carga de la siguiente sin duplicados, vacío, error con reintento y filtro por categoría. Ruta: padre.
- [x] **T3 — Detalle en `/anuncios/:id`**: galería, información, estados 404 y error, enlace desde la tarjeta. Ruta: padre.
- [x] **T4 — Pruebas del detalle**: render, 404 y enlace de vuelta. Ruta: padre.
- [x] **T5 — Verificación visual**: build servido con Vite en un panel de Herdr y capturas a 1440×900 y 390 contra `design/preview/`. Ruta: padre.

## Log

- **L1 (2026-10-22, verbatim)**: "dale sigue con inc2 pero puedes trabajar con herdr?"
- **Diseño del detalle (2026-10-22)**: no existía página de detalle en el `.fig`; se creó `08 · Detalle` con tres estados por plataforma (default, no disponible, error) y seis PNG en `design/preview/08-detalle/`. Se reutilizó el header real de `01 · Catálogo` clonándolo en cada frame, así que la cabecera es idéntica y no una reconstrucción. Hallazgo de contrato que condiciona la vista: `AnuncioResumen`/`AnuncioDetalle` exponen `vendedorId` pero **ningún nombre público de vendedor** y no hay endpoint público de perfil, así que la tarjeta y el detalle muestran categoría y fecha, no "Ana M." como en el preview.
- **Herdr (2026-10-22)**: servidor de Vite levantado en el panel `w5:p6` (`pnpm dev:web`, `http://localhost:5173`) para la verificación en navegador.
- **Catálogo y detalle implementados (2026-10-22)**: `/` reemplaza la portada por la grilla con filtros de categoría, orden, búsqueda por `q` en la URL y "Cargar más" con cursor; `/anuncios/:id` añade galería, información y los desenlaces 404/error. Se extrajo `CabeceraPublica` para compartir header entre catálogo y detalle. Pruebas: 20 en la app (catálogo 2, detalle 2); `pnpm build:web` limpio. Verificación visual con datos reales pendiente: la API no está levantada.
- **Verificación con datos reales (2026-10-22)**: se levantó Postgres + el jar de `uni-market-api` y el catálogo mostró el anuncio aprobado de la BD de desarrollo (imagen, `$45.00`, "Sin categoría", "Hace 1 día"); el detalle mostró galería, fecha y descripción. Dos defectos visuales corregidos: la imagen de la tarjeta ignoraba el `aspect-ratio` 16:10 (`<img height:100%>` estiraba el contenedor; se sacó del flujo con `position:absolute`), y la fecha relativa iba en minúscula inicial. Búsqueda: ahora escribe `?q=` en la URL y el campo se sincroniza al limpiar filtros. El CTA de contacto autenticado se retiró hasta el Inc 5 (mensajería). 25 pruebas en la app.

- **Nombre del vendedor (2026-10-24)**: la issue #2 de la API se resolvió con `vendedorNombre` en `AnuncioResumen` (heredado por detalle y panel). Se sincronizó el contrato al commit `0dd0bac`, se regeneró el cliente y la tarjeta muestra `Categoría · Ana P.` y el detalle una fila `Vendedor: Ana P.`. `api:check` y 32 pruebas en verde. El preview de detalle todavía no incluye esa fila; queda como ajuste menor del `.fig`.
- **Robustez del catálogo (2026-10-24)**: una secuencia de solicitudes descarta respuestas viejas (cambiar de filtro ya no mezcla páginas), un error de recarga conserva los resultados previos con el aviso encima, y "Cargar más" se deshabilita mientras recarga. Se eligió secuencia en lugar de `AbortController` porque el cliente generado no expone la señal. 2 pruebas nuevas (34 en la app, 104 en el workspace).
- **Verificación visual con datos (2026-10-24)**: catálogo y detalle a 390 y 1440, y tema oscuro con `prefers-color-scheme`. El servidor devolvió `vendedorNombre: "Reporte D."` y la UI lo pintó en la tarjeta y en el detalle. Defecto encontrado y corregido: en móvil la cabecera no envolvía porque las reglas `@media` se quedaron en `catalogo.module.css` al extraer `CabeceraPublica`; ahora marca, acciones y búsqueda van en filas separadas.
- **Pendiente de diseño**: la fila del vendedor no está en el frame `08 · Detalle` (OpenPencil estaba cerrado al cerrar el corte).
