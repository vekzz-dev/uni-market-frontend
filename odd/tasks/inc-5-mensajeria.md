# Inc 5 — Mensajería web

**Objetivo**: conversaciones del usuario, hilo con cursor hacia atrás, envío de texto y marcado de lectura, más el contacto desde el detalle.
**Rama**: `feat/inc-5-mensajeria` · **Runner**: `pnpm test`, `pnpm lint`, `pnpm format:check`.
**Diseño**: páginas `11 · Mensajes` y `12 · Conversación` (web). **Bloqueado hasta que OpenPencil esté abierto con `design/uni-market.fig`.**

## Specs

- **S1 — Lista**: `GET /v1/mis-conversaciones` offset (`pagina`, `limite`) con `ultimoMensaje` y `noLeidos`. Como comprador o vendedor. Estados vacío y error.
- **S2 — Hilo**: `GET /v1/conversaciones/{id}/mensajes` con cursor opaco `(fechaCreacion, id)` hacia atrás; sin cursor devuelve los más recientes. El `GET` no muta `leido`.
- **S3 — Envío**: `POST /v1/conversaciones/{id}/mensajes` con `{ texto }` → `201`. Texto vacío o solo espacios se valida en el cliente (espejo del `422`).
- **S4 — Lectura**: `POST /v1/conversaciones/{id}/lecturas` sin cuerpo → `204`; el contador de no leídos baja al volver a la lista. Acción explícita, nunca implícita en un `GET`.
- **S5 — Contacto**: en el detalle, "Contactar" abre o reutiliza la conversación con `POST /v1/conversaciones` (`200` existente, `201` nueva, `422` auto-conversación) y navega al hilo.
- **S6 — Acceso**: solo participantes (`403`), `404` indistinguible, `401` a entrar.

## Tareas

- [ ] **T1 — Diseño**: `11 · Mensajes` (datos, vacío, error) y `12 · Conversación` (default, enviando, vacío) en web; PNG en `design/preview/`. **Bloqueada: OpenPencil cerrado.**
- [ ] **T2 — Lista**: `/mensajes` con offset, último mensaje, no leídos y estados.
- [ ] **T3 — Hilo**: `/mensajes/:id` con cursor hacia atrás, envío y lectura.
- [ ] **T4 — Contacto**: acción en el detalle que abre o reutiliza la conversación.
- [ ] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-11-09, verbatim)**: "dale arranca"
- **Alcance (2026-11-09)**: contrato revisado (`/mis-conversaciones`, `/conversaciones/{id}/mensajes` con cursor, `/mensajes`, `/lecturas`, `POST /conversaciones`). El cliente generado ya expone los métodos: no hace falta resincronizar el contrato.
- **Bloqueo (2026-11-09)**: OpenPencil no está conectado; el incremento sigue la convención de diseño primero (como Inc 4). Se escribe la issue y este track; la implementación de pantallas espera a los frames.
