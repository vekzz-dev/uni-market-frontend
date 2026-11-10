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

- [x] **T1 — Diseño**: `13 · Perfil` (datos, guardado, error) y móvil; cuatro PNG en `design/preview/13-perfil/`.
- [x] **T2 — Datos y avatar**: lectura, edición del nombre y avatar con sus estados.
- [x] **T3 — Contraseña**: formulario con validación espejo y confirmación.
- [x] **T4 — Baja**: confirmación, cierre de sesión y salida.
- [ ] **T5 — Pruebas y verificación** con la API real.

## Log

- **L1 (2026-11-10, verbatim)**: "sigue con inc6"
- **Diseño (2026-11-10)**: página `13 · Perfil` con datos, guardado y error en web y datos en móvil; cuatro PNG.
- **Implementación (2026-11-10)**: `/perfil` con carga de `GET /usuarios/me`, edición del nombre (`PATCH`), avatar (subir con validación espejo de 2 MB y tipos, eliminar) y correo de solo lectura. El gestor de sesión gana `actualizarUsuario` para que la cabecera refleje el nombre y el avatar sin recargar. Contraseña con validación de mínimo y coincidencia, y baja con confirmación que cierra sesión y sale al catálogo. La cabecera del catálogo y del panel muestran el avatar enlazado al perfil. 11 pruebas nuevas (100 en la web) y 2 en core.
