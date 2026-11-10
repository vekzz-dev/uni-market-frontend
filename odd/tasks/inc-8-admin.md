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
- [x] **T2 — Usuarios**: listado, filtro por rol, paginación y estados.
- [x] **T3 — Rol y habilitación**: cambios con feedback y errores.
- [x] **T4 — Categorías**: listado, alta, edición y baja con confirmación.
- [x] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-11-10, verbatim)**: "si"
- **Nota (2026-11-10)**: el diseño de este incremento es solo web; la administración es de escritorio y la paridad móvil corresponde a Inc 9.
- **Diseño (2026-11-10)**: páginas `15 · Admin usuarios` (lista y vacío) y `16 · Admin categorías` (lista y formulario), solo web; cuatro PNG.
- **Implementación (2026-11-10)**: `/admin/usuarios` con filtro por rol, paginación, cambio de rol por selector y habilitación; el 403 del propio rol se explica en un aviso. `/admin/categorias` con alta en línea, edición precargada, baja con confirmación y 409 de nombre duplicado. Ambas rutas dependen de su capacidad (`admin.usuarios`, `categorias.gestionar`) y ofrecen desenlace sin acceso. 18 pruebas nuevas (128 en la web), con `axe`.
- **Verificación real (2026-11-10)**: admin promovido por SQL antes del JWT. Con el cliente generado: lista de usuarios con `habilitado`, cambio de rol, `403` al cambiar el propio y `422` con el rol igual; inhabilitar deja el login en `401` y rehabilitar lo restaura; categorías: alta con `orden` asignado, `409` al duplicar, edición y baja; un miembro pidiendo usuarios recibe `403`.
- **Smoke de navegador (2026-11-10)**: Playwright con la cuenta admin: `/admin/usuarios` muestra filtros, selector de rol y acciones por fila; `/admin/categorias` lista las categorías con Editar/Eliminar y el botón de alta. Servicios detenidos.
- **Guarda de auto-bloqueo (2026-11-10)**: la fila propia no ofrece el selector de rol ni el botón de habilitación; muestra "Tú". Evita que un admin se inhabilite o se cambie el rol por accidente (el servidor ya devuelve `403` al cambiar el propio rol, pero la habilitación no tenía guarda).
- **Buscador (2026-11-10)**: la API `v1.4.0` (`a31636c`) añade `q` a `GET /admin/usuarios` (issue `uni-market-api#7`). Se resincronizó el contrato y se regeneró el cliente; la pantalla busca por nombre o email con botón y "Limpiar", combinable con el filtro de rol, y el vacío cita el término. 4 pruebas nuevas (133 en la web). El diseño de la página 15 incorpora el campo.
- **Verificación del buscador (2026-11-10)**: con el cliente real: `q=inc8` devuelve 2 cuentas, `q=OTRO` funciona sin distinguir mayúsculas, combinado con `rol=moderador` devuelve 1, `q=%` se trata como literal (0 resultados), sin `q` el total vuelve a 10, 201 caracteres dan `400` y sin rol admin `403`. En el navegador, buscar "otro" filtra la lista a esa cuenta.
