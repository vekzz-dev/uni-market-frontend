# Inc 8 — Administración web

**Objetivo**: gestionar usuarios (rol y habilitación) y categorías (CRUD) desde la web.
**Rama**: `feat/inc-8-admin` · **Runner**: `pnpm test`, `pnpm lint`, `pnpm format:check`.
**Diseño**: páginas `15 · Admin usuarios` y `16 · Admin categorías` (solo web; el móvil llega con Inc 9).

## Specs

- **S1 — Usuarios**: `GET /v1/admin/usuarios` con `rol` opcional, `pagina` y `limite`; offset + total; muestra nombre, email, rol y `habilitado`.
- **S2 — Rol**: `PATCH /v1/admin/usuarios/{id}/rol` con `{ rol }` → `200`. El propio rol → `403`; rol igual al actual → `422`.
- **S3 — Habilitación**: `PATCH /v1/admin/usuarios/{id}/habilitacion` con `{ habilitado }` → `200`.
- **S4 — Categorías**: `GET /v1/categorias` + `POST`, `PATCH /v1/categorias/{id}` y `DELETE /v1/categorias/{id}` con confirmación; nombre duplicado → `409`.
- **S5 — Acceso**: `admin.usuarios` para `/admin/usuarios`; `categorias.gestionar` para `/admin/categorias`; enlaces solo con capacidad.

## Tareas

- [x] **T1 — Diseño**: `15 · Admin usuarios` (lista y vacío) y `16 · Admin categorías` (lista y formulario), solo web; cuatro PNG.
- [ ] **T2 — Usuarios**: listado, filtro por rol, paginación y estados.
- [ ] **T3 — Rol y habilitación**: cambios con feedback y errores.
- [ ] **T4 — Categorías**: listado, alta, edición y baja con confirmación.
- [ ] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-11-10, verbatim)**: "si"
- **Nota (2026-11-10)**: el diseño de este incremento es solo web; la administración es de escritorio y la paridad móvil corresponde a Inc 9.
