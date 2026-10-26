# Inc 4 — Vendedor web

**Objetivo**: publicar anuncios con imágenes, ver su estado de revisión y gestionarlos (editar, visibilidad, vendido, baja).
**Rama**: `feat/inc-4-vendedor` · **Diseño**: páginas `09 · Publicar` y `10 · Mis anuncios` (web).

## Specs

- **S1 — Publicar**: `POST /v1/anuncios` multipart con nombre, precio, categoría, descripción y 1–5 imágenes (JPG/PNG/GIF/WEBP, 5 MB). Nace `pendiente`; 201 + `Location`. Validación espejo y 422 del servidor visibles.
- **S2 — Mis anuncios**: `GET /v1/mis-anuncios` offset (pagina/limite) con `estadoRevision`, `motivoRechazo` y acciones. Nunca devuelve anuncios ajenos.
- **S3 — Gestión**: editar contenido (reset a `pendiente`), alternar visibilidad (`disponible ↔ inactivo`), marcar vendido y baja lógica.
- **S4 — Acceso**: solo vendedor autenticado; 401 redirige a entrar y 403/404 se muestran sin filtrar datos.

## Tareas

- [x] **T1 — Diseño**: `09 · Publicar` (default, subiendo, error 422) y `10 · Mis anuncios` (datos, vacío, error) en web.
- [x] **T2 — Publicar**: formulario multipart y estados.
- [x] **T3 — Mis anuncios**: listado offset, badges y motivo.
- [ ] **T4 — Gestión**: visibilidad, vendido y baja resueltos; **falta editar** (PATCH de contenido).
- [ ] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-10-26, verbatim)**: "arranca"

- **Diseño (2026-10-26)**: páginas `09 · Publicar` (default, publicando, error 422) y `10 · Mis anuncios` (datos con badges y motivo de rechazo, vacío, error), web y móvil. Doce PNG en `design/preview/`. Lint de ambas páginas en 0 hallazgos.
- **Frames móviles (2026-10-26)**: añadidos los tres estados de `Publicar` y `Mis anuncios` a 390. Publicar: el estado `publicando` ya no atenúa el formulario (etiquetas legibles) y el header lleva a "Mis anuncios" para no duplicar el CTA. Acciones del panel por estado: pendiente y rechazado → Editar/Eliminar; aprobado → Editar/Ocultar/Vendido/Eliminar; vendido → Editar/Eliminar. Los estados vacío y error web quedaron centrados.
- **Anchos (2026-10-26)**: medido por nodo: en móvil el formulario y la tarjeta de ayuda no tenían `w="fill"` y se encogían a 283; quedaron en 358 con campos de 326 (16 px de margen y padding). En web, tarjeta 720 y campos 672. Reexportados los seis PNG de Publicar.
- **Web medido (2026-10-26)**: Publicar tiene tarjeta de 720 y campos de 672 (24 de padding), sin desborde. En Mis anuncios la columna de estado/acciones variaba (135 vs 289 en la fila aprobada); se normalizó a 289 en las cuatro filas: 72 + 16 + 951 + 16 + 289 + 32 = 1376 exactos. Reexportado el PNG web.
- **Alturas (2026-10-26)**: el formulario web medía 733 y el contenido necesitaba 868 dentro de 828, así que se salía 40 px; los frames pasaron a 940 (default/publicando) y 1000 (error). En móvil se quitó la tarjeta de ayuda de Publicar (redundante con el subtítulo y el dropzone): 1011 → 885, error 1060 → 934.
- **Publicar implementado (2026-10-26)**: ruta `/publicar` con guard de sesión, formulario (nombre, precio, categoría, descripción, 1–5 imágenes), validación espejo y `POST /v1/anuncios` multipart por el cliente generado con `sesion.ejecutar`. Desenlace "Anuncio publicado" (pendiente de revisión), 422 visible y 401 a entrar. CTA "Publicar anuncio" en el header del catálogo cuando hay sesión. 4 pruebas nuevas (38 en la web).
- **Mis anuncios (2026-10-26)**: `/mis-anuncios` con offset, badges priorizados por revisión (pendiente/rechazado) y estado (vendido/inactivo/aprobado), `motivoRechazo`, acciones Ocultar/Mostrar, Vendido y Eliminar con confirmación, paginación Anterior/Siguiente y estados vacío/error. Enlace desde el header del catálogo y desde el desenlace de Publicar. 5 pruebas nuevas (43 en la web).
