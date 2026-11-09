# Inc 4 — Vendedor web

**Objetivo**: publicar anuncios con imágenes, ver su estado de revisión y gestionarlos (editar, visibilidad, vendido, baja).
**Rama**: `feat/inc-4-vendedor` · **Diseño**: páginas `09 · Publicar` y `10 · Mis anuncios` (web).

## Specs

- **S1 — Publicar**: `POST /v1/anuncios` multipart con nombre, precio, categoría, descripción y 1–5 imágenes (JPG/PNG/GIF/WEBP, 5 MB). Nace `pendiente`; 201 + `Location`. Validación espejo y 422 del servidor visibles.
- **S2 — Mis anuncios**: `GET /v1/mis-anuncios` offset (pagina/limite) con `estadoRevision`, `motivoRechazo` y acciones. Filtro aditivo por `estadoRevision` (`pendiente|aprobado|rechazado|retraido`); sin el parámetro, panel completo. Nunca devuelve anuncios ajenos.
- **S3 — Gestión**: editar contenido (reset a `pendiente`) releyendo el anuncio con `GET /v1/mis-anuncios/{id}` — sin depender del estado de navegación; alternar visibilidad (`disponible ↔ inactivo`), marcar vendido y baja lógica.
- **S4 — Acceso**: solo vendedor autenticado; 401 redirige a entrar y 403/404 se muestran sin filtrar datos.

## Tareas

- [x] **T1 — Diseño**: `09 · Publicar` (default, subiendo, error 422) y `10 · Mis anuncios` (datos, vacío, error) en web.
- [x] **T2 — Publicar**: formulario multipart y estados.
- [x] **T3 — Mis anuncios**: listado offset, badges y motivo.
- [x] **T4 — Gestión**: editar (PATCH de contenido con reset a revisión), visibilidad, vendido y baja.
- [x] **T5 — Pruebas y verificación** con la API real.
- [x] **T6 — Panel por id y filtro** (issue `uni-market-api#3`): contrato resincronizado, `GET /mis-anuncios/{id}` en la edición y filtro por `estadoRevision` con chip de retraído. Commit `a112569`.

## Log

- **L1 (2026-10-26, verbatim)**: "arranca"

- **Diseño (2026-10-26)**: páginas `09 · Publicar` (default, publicando, error 422) y `10 · Mis anuncios` (datos con badges y motivo de rechazo, vacío, error), web y móvil. Doce PNG en `design/preview/`. Lint de ambas páginas en 0 hallazgos.
- **Frames móviles (2026-10-26)**: añadidos los tres estados de `Publicar` y `Mis anuncios` a 390. Publicar: el estado `publicando` ya no atenúa el formulario (etiquetas legibles) y el header lleva a "Mis anuncios" para no duplicar el CTA. Acciones del panel por estado: pendiente y rechazado → Editar/Eliminar; aprobado → Editar/Ocultar/Vendido/Eliminar; vendido → Editar/Eliminar. Los estados vacío y error web quedaron centrados.
- **Anchos (2026-10-26)**: medido por nodo: en móvil el formulario y la tarjeta de ayuda no tenían `w="fill"` y se encogían a 283; quedaron en 358 con campos de 326 (16 px de margen y padding). En web, tarjeta 720 y campos 672. Reexportados los seis PNG de Publicar.
- **Web medido (2026-10-26)**: Publicar tiene tarjeta de 720 y campos de 672 (24 de padding), sin desborde. En Mis anuncios la columna de estado/acciones variaba (135 vs 289 en la fila aprobada); se normalizó a 289 en las cuatro filas: 72 + 16 + 951 + 16 + 289 + 32 = 1376 exactos. Reexportado el PNG web.
- **Alturas (2026-10-26)**: el formulario web medía 733 y el contenido necesitaba 868 dentro de 828, así que se salía 40 px; los frames pasaron a 940 (default/publicando) y 1000 (error). En móvil se quitó la tarjeta de ayuda de Publicar (redundante con el subtítulo y el dropzone): 1011 → 885, error 1060 → 934.
- **Publicar implementado (2026-10-26)**: ruta `/publicar` con guard de sesión, formulario (nombre, precio, categoría, descripción, 1–5 imágenes), validación espejo y `POST /v1/anuncios` multipart por el cliente generado con `sesion.ejecutar`. Desenlace "Anuncio publicado" (pendiente de revisión), 422 visible y 401 a entrar. CTA "Publicar anuncio" en el header del catálogo cuando hay sesión. 4 pruebas nuevas (38 en la web).
- **Mis anuncios (2026-10-26)**: `/mis-anuncios` con offset, badges priorizados por revisión (pendiente/rechazado) y estado (vendido/inactivo/aprobado), `motivoRechazo`, acciones Ocultar/Mostrar, Vendido y Eliminar con confirmación, paginación Anterior/Siguiente y estados vacío/error. Enlace desde el header del catálogo y desde el desenlace de Publicar. 5 pruebas nuevas (43 en la web).
- **Editar (2026-10-26)**: `/mis-anuncios/:id/editar` recibe el anuncio por estado de navegación (el panel no tiene GET por id), precarga nombre/precio/categoría/descripción y hace `PATCH /anuncios/{id}/contenido`; al guardar vuelve a revisión. Las imágenes se editan por separado (endpoint propio). Si se recarga la URL sin estado, muestra un desenlace para volver al panel. 3 pruebas nuevas (46 en la web).
- **Verificación real (2026-10-26)**: con Postgres + jar se registró y confirmó un vendedor, se publicó un anuncio con PNG (201, `pendiente`), el panel lo listó, el PATCH de contenido devolvió a `pendiente`, y tras aprobar por SQL se probaron visibilidad (`inactivo`/`disponible`) y vendido (`vendido`) con 200. La UI usa el cliente generado (visibilidad y vendido son `POST`, no `PATCH`). Servicios detenidos al terminar.
- **Smoke real de UI (2026-10-26)**: login por la pantalla de entrar, publicar `Smoke Inc4` con un PNG por la UI (multipart), desenlace "Anuncio publicado" y panel con el anuncio en `En revisión`. El smoke destapó que el arreglo del meta no se había aplicado (un pendiente aparecía como "Visible en el catálogo"); corregido y con prueba. 47 pruebas en la web. Servicios detenidos.
- **Issue API #3 (2026-11-05)**: contrato resincronizado desde `uni-market-api` (`3e8c5d5`, antes congelado en `0dd0bac`) y cliente regenerado. El panel filtra por `estadoRevision` con cinco chips (Todos, Pendientes, Aprobados, Rechazados, Retraídos), el vacío filtrado es distinto del panel vacío y el badge distingue `retraido` de un rechazo normal. `/mis-anuncios/:id/editar` relee el anuncio con `GET /mis-anuncios/{id}` y ya no depende del estado de navegación, así que recargar la URL funciona. Se añadió el enlace **Editar** en el panel: la pantalla existía y estaba probada, pero no había forma de llegar a ella desde la interfaz. 6 pruebas nuevas (53 en la web).
- **Verificación real contra la API (2026-11-05)**: Postgres + jar, usuario confirmado por el token del log, anuncio publicado por multipart. Con el cliente generado: `leerMiAnuncio` devuelve `AnuncioPanel` con `descripcion`, `categoriaId`, `imagenUrls` y `retraido: false`; `estadoRevision=pendiente` devuelve total 1, `aprobado` total 0, un valor inválido da `400` y un id inexistente `404`. `pnpm lint`, `format:check`, `api:check` y `contract:check` limpios. El smoke de navegador no se ejecutó: no hay binarios de navegador instalados en la máquina. Servicios detenidos.
