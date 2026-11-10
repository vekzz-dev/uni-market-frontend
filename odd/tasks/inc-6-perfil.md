# Inc 6 — Perfil web

**Objetivo**: gestionar la propia cuenta: nombre, avatar, contraseña y baja.
**Rama**: `feat/inc-6-perfil` · **Runner**: `pnpm test`, `pnpm lint`, `pnpm format:check`.
**Diseño**: página `13 · Perfil` (web y móvil).

## Specs

- **S1 — Datos**: `GET /v1/usuarios/me` al entrar; `PATCH /v1/usuarios/me` con `{ nombre }` (1–255). El email es de solo lectura. La cabecera refleja el nombre nuevo sin recargar.
- **S2 — Avatar**: `PUT /v1/usuarios/me/avatar` multipart `{ archivo }` (≤ 2 MB, jpeg/png/gif/webp) y `DELETE /v1/usuarios/me/avatar` → `204`. El `422` se muestra.
- **S3 — Contraseña**: `PATCH /v1/usuarios/me/contrasena` con `{ contrasenaActual, nuevaContrasena }` (mínimo 8); `204` y confirmación.
- **S4 — Baja**: `DELETE /v1/usuarios/me` → `204`, con confirmación explícita; después, sesión cerrada y catálogo anónimo.
- **S5 — Acceso**: solo autenticado; `401` a entrar; la cabecera enlaza al perfil con el avatar.

## Tareas

- [ ] **T1 — Diseño**: `13 · Perfil` (datos, guardado, error) y móvil; PNG en `design/preview/13-perfil/`.
- [ ] **T2 — Datos y avatar**: lectura, edición del nombre y avatar con sus estados.
- [ ] **T3 — Contraseña**: formulario con validación espejo y confirmación.
- [ ] **T4 — Baja**: confirmación, cierre de sesión y salida.
- [ ] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-11-10, verbatim)**: "sigue con inc6"
