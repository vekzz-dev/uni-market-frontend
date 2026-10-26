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
- [ ] **T2 — Publicar**: formulario multipart y estados.
- [ ] **T3 — Mis anuncios**: listado offset, badges y motivo.
- [ ] **T4 — Gestión**: editar, visibilidad, vendido y baja.
- [ ] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-10-26, verbatim)**: "arranca"

- **Diseño (2026-10-26)**: páginas `09 · Publicar` (default, publicando, error 422) y `10 · Mis anuncios` (datos con badges y motivo de rechazo, vacío, error), solo web; los frames móviles corresponden al Inc 9. Seis PNG en `design/preview/`. Lint de ambas páginas en 0 hallazgos.
