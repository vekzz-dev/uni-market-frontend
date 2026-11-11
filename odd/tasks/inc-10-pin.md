# Inc 10 — PIN de confirmación y reset

**Objetivo**: adaptar web y móvil al contrato `v2.0.0` de la API, donde la confirmación de cuenta y el restablecimiento de contraseña usan un PIN de 6 dígitos en vez de un enlace con token. **Rama**: `feat/inc-10-pin` · **Entrega**: ask-on-risk · **Runner**: `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm contract:check`, `pnpm api:check`.

## Specs

- **S1 — Contrato sincronizado**: `openapi/uni-market.yaml` y `CONTRACT.lock.json` al día contra `uni-market-api` (commit `29c743f`, sha256 `118a103544c35d831a7a8ab71a6b847fd5010ede888d9eb1251c8075533289fa`), y `packages/api-client` regenerado. `pnpm contract:check` y `pnpm api:check` en verde.
- **S2 — Confirmar email (web)**: deja de leer `?token` y pasa a un formulario con **email** y **PIN**. Envía `POST /v1/auth/confirmar-email` con `{email, pin}` (operación `confirmarEmail` regenerada, antes `confirmarEmail(token)`). Éxito → "Cuenta confirmada" con botón "Entrar". El contrato exige `pin` con `pattern: '^\d{6}$'` y `required: [email, pin]`.
- **S3 — Nueva contraseña (web)**: formulario con **email**, **PIN**, **nueva contraseña** y **repetir**. Envía `POST /v1/auth/restablecer-contrasena/confirmar` con `{email, pin, nuevaContrasena}`. Validación espejo antes de llamar: PIN de 6 dígitos, contraseña ≥ 8 y coincidencia de las dos.
- **S4 — Paridad móvil**: los componentes `Confirmar` y `NuevaContrasena` de `apps/mobile/src/pantallas/Sesion.jsx` replican S2 y S3.
- **S5 — Validación espejo del PIN**: `packages/core` expone el validador del PIN (6 dígitos) y reutiliza el de email existente, para que web y móvil no dupliquen el patrón.
- **S6 — Mensaje genérico (R13)**: un `422` se muestra con el texto del servidor sin intentar distinguir cuenta inexistente, PIN incorrecto, ajeno, expirado, usado o agotado. La API responde verbatim `"El código es inválido, expiró o ya fue usado."` y un `429` se trata como límite de peticiones.
- **S7 — Pruebas en ambas plataformas**: web (`confirmar.test.jsx`, `recuperacion.test.jsx`) y móvil (pruebas nuevas de confirmar y nueva contraseña, que **hoy no existen**). Cubren: envío con email+PIN, `422` genérico, `429`, validación espejo y que ya no se usa `token`.
- **S8 — Documentación**: `docs/api-integration.md` §7 y el flujo de sesión, `README.md` (conteo de pruebas), y las menciones a "enlace"/"24 h"/"60 min" que queden obsoletas. R11–R13 viven en `uni-market-api` y no se duplican.
- **S9 — Diseño**: páginas `04-confirmar` y `06-nueva-contrasena` del archivo `design/uni-market.fig` pasan de estados de enlace (`verificando` / `confirmado` / `invalido`) a formulario de código, en web y móvil, con sus PNG en `design/preview/`. **Bloqueada: OpenPencil no está corriendo.**

## Tareas

- [x] **T1 — Contrato y cliente** (S1). Ruta: padre. Commit `b677a99`.
- [x] **T2 — Validación espejo del PIN** (S5). Ruta: padre. Commit `b677a99`.
- [x] **T3 — Web: Confirmar y Nueva contraseña** (S2, S3, S6) + pruebas (S7). Ruta: padre. Commit `0a37822`.
- [x] **T4 — Móvil: paridad** (S4, S6) + pruebas (S7). Ruta: padre. Commit `2bcab83`.
- [x] **T5 — Documentación** (S8). Ruta: padre.
- [ ] **T6 — Diseño** (S9). Ruta: padre. **BLOQUEADA por entorno.**

## Log

- **L1 (2026-11-11, verbatim)**: "si" — en respuesta a: "¿Quieres que lo implemente como incremento aparte, con contrato regenerado, formularios en web y móvil, diseño actualizado y pruebas en ambas plataformas?"
- **Contexto (2026-11-11)**: issue #8 de `uni-market-api`, cerrado ese día a las 21:51 UTC, publicado en `v2.0.0`. Rompe el cliente: desaparece `GET /v1/auth/confirmar-email?token=`, y cambian los cuerpos de `POST /auth/confirmar-email` (`{email, pin}`) y `POST /auth/restablecer-contrasena/confirmar` (`{email, pin, nuevaContrasena}`). PIN de 6 dígitos, vigencia 15 min, máximo 5 intentos.
- **Verificación del punto de partida (2026-11-11)**: `pnpm contract:drift` falla con origen `118a1035…` frente a local `462faf60…`. Contra la API viva: `GET /auth/confirmar-email?token=abc` → **500** (ruta eliminada), `POST` con `{email, pin}` → **422** "El código es inválido, expiró o ya fue usado.", `POST` con `{token}` → **400** "email: must not be blank; pin: must not be blank". El código seguía en el flujo viejo en `apps/web/src/pantallas/Confirmar.jsx:34`, `apps/web/src/pantallas/NuevaContrasena.jsx:17`, `apps/mobile/src/pantallas/Sesion.jsx:215` y `:390`.
- **Hueco encontrado (2026-11-11)**: el móvil no tiene ninguna prueba de confirmar ni de nueva contraseña; el web sí. Es el motivo por el que la rotura no se habría visto probando solo en móvil.
- **Bloqueo (2026-11-11)**: el diseño (S9/T6) no se puede hacer en esta sesión porque la app OpenPencil no está conectada. Se entrega el resto y se retoma cuando esté abierta.

- **T1 cerrado (2026-11-11)**: contrato sincronizado a `29c743f` y cliente regenerado; `confirmarEmail` ahora recibe `ConfirmarEmailRequest` en vez del token. `validarPin` y `validarEmail` en `core`, con 5 pruebas nuevas (48 en `core`). `contract:check` y `api:check` en verde.
- **T2 cerrado (2026-11-11)**: `validarEmail` se extrae de `validarRegistro` sin cambiar la regla ni el comportamiento; `validarRegistro` la reutiliza. RED observado antes de implementar (import roto con las dos funciones nuevas).
- **T3 cerrado (2026-11-11)**: web con formularios de email + PIN. El `mapearProblema` existente ya muestra el `detail` del 422, así que S6 salió sin tocar `core/errores`. Corregido el copy de Registro/Restablecer/Reenviar (enlaces, 24 h, 60 min). **136 pruebas web.** Dos fallos propios durante el trabajo: `jest-dom` no está instalado (no hay `toHaveTextContent`) y un helper de prueba no toleraba llamarse sin argumentos.
- **T4 cerrado (2026-11-11)**: paridad móvil. **Hallazgo**: en RTL 14 `fireEvent` es asíncrono igual que `render`; sin `await`, `changeText` no actualiza el estado y el formulario se envía vacío. Se confirmó instrumentando, no adivinando. **46 pruebas móvil** (6 nuevas), donde antes no había ninguna de estos flujos.
- **T5 cerrado (2026-11-11)**: `docs/api-integration.md` gana §2.4 con la tabla de endpoints y las reglas del PIN, y §3.3 la fila de validación espejo; `docs/frontend-design.md` corrige el mapa de pantallas; `README.md` a 260 pruebas.
- **Verificación (2026-11-11)**: `pnpm test` **260** (tokens 23 · api-client 7 · core 48 · web 136 · móvil 46), exit 0; `lint` y `format:check` limpios; `contract:check` y `api:check` OK; `build:web` 429,22 kB → 112,13 kB gzip; `budget:web` 108,5 KB de 220 KB; `export:web` del móvil exporta.
- **S9/T6 sigue bloqueada**: `design/preview/README.md` todavía describe los estados de las páginas `04-confirmar` (`verificando`, `confirmado`, `inválido`) y `06-nueva-contrasena` (`default`, `inválido`, `listo`), que corresponden a los PNG viejos. **No se tocó a propósito**: cambiarlo sin regenerar los PNG dejaría la documentación mintiendo sobre los assets. Se corrige junto con el diseño.
