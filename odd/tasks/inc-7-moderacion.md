# Inc 7 — Moderación web

**Objetivo**: cola de revisión FIFO con decisión motivada (aprobar, rechazar, retraer) y acceso por rol.
**Rama**: `feat/inc-7-moderacion` · **Runner**: `pnpm test`, `pnpm lint`, `pnpm format:check`.
**Diseño**: página `14 · Moderación` (web y móvil).

## Specs

- **S1 — Cola**: `GET /v1/moderacion/anuncios` con `estadoRevision` (default `pendiente`), `pagina`, `limite`; FIFO por `fechaCreacion ASC`; offset + total.
- **S2 — Decisión**: `POST /v1/moderacion/anuncios/{id}/decisiones` con `{ decision: aprobar|rechazar|retraer, motivoRechazo }` → `200` con el anuncio. Rechazar y retraer exigen motivo no vacío (espejo del `422`).
- **S3 — Anuncio propio**: el servidor responde `403`; se muestra en la fila sin romper la cola.
- **S4 — Acceso**: solo `moderador` o superior (`puede(rol, "moderacion.decidir")`); `401` a entrar y desenlace de acceso sin capacidad.
- **S5 — Estados**: cola con datos, vacía, error; decisión en curso y confirmación visible.

## Tareas

- [x] **T1 — Diseño**: `14 · Moderación` (cola, rechazo con motivo, vacío) y móvil; cuatro PNG en `design/preview/14-moderacion/`.
- [x] **T2 — Cola**: `/moderacion` con filtro por estado, paginación y estados.
- [x] **T3 — Decisión**: aprobar, rechazar y retraer con motivo y feedback.
- [x] **T4 — Acceso**: capacidad, enlace en la cabecera y `403` propio.
- [ ] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-11-10, verbatim)**: "arranca con inc 7"
- **Diseño (2026-11-10)**: página `14 · Moderación` con cola, rechazo con motivo en línea y vacío en web, más la cola móvil; cuatro PNG.
- **Implementación (2026-11-10)**: `/moderacion` con filtros (pendientes por defecto), paginación, decisión en línea con motivo validado en espejo y feedback por acción. `puede(rol, "moderacion.decidir")` controla el enlace en la cabecera y la ruta; sin capacidad hay desenlace de acceso. El 403 del anuncio propio se muestra dentro del panel de decisión. 10 pruebas nuevas (110 en la web), con `axe`.
