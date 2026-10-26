# Inc 3 — App móvil (Expo)

**Objetivo**: shell de Expo con paridad de sesión y catálogo sobre el mismo contrato y núcleo compartido.
**Rama**: `feat/inc-3-movil` · **Verificación**: `pnpm --filter @uni-market/mobile export:web`
**Diseño**: frames móviles de `design/uni-market.fig` (catálogo y sesión).

## Specs

- **S1 — Shell Expo**: Expo SDK 58 + Expo Router, tokens Ember por `themeFor(mode)` y tema según el sistema.
- **S2 — Sesión**: `crearGestorSesion` del core, refresh en `expo-secure-store` (localStorage solo en web) y restauración única.
- **S3 — Catálogo**: misma lógica que la web (cursor, filtros, secuencia de solicitudes, error conservando resultados) con `FlatList`.
- **S4 — Detalle y sesión**: detalle con vendedor, 404/error; entrar, registro, confirmar, restablecer, nueva contraseña y reenvío.
- **S5 — Pruebas**: jest-expo + Testing Library pendiente; la paridad se verificó con Expo web a 390.

## Tareas

- [x] **T1 — Shell**: `apps/mobile` con Expo Router, Metro de monorepo y tokens.
- [x] **T2 — Sesión**: provider, almacén seguro y pantallas de sesión.
- [x] **T3 — Catálogo y detalle**: pantallas y navegación.
- [x] **T4 — Verificación visual**: Expo web a 390 con la API real (catálogo y detalle).
- [x] **T5 — Suite móvil**: `jest-expo` 58 con **Jest 29** y `transformIgnorePatterns: []` (el setup ESM de `@react-native/jest-preset` 0.88 se transpila). Pruebas de tema y catálogo con Testing Library.

## Log

- **L1 (2026-10-24, verbatim)**: "sigamos con la inc 3"
- **Shell y paridad (2026-10-24)**: `apps/mobile` con Expo 58/React Native 0.88, Expo Router 58 y Metro configurado para el monorepo pnpm. Tokens por `themeFor`, sesión con SecureStore (localStorage en web) y las seis pantallas de sesión más catálogo y detalle. Verificado con `expo export --web` (10 rutas) y capturas a 390 contra la API real: el catálogo muestra `Sin categoría · Reporte D.` y el detalle la fila del vendedor. La suite móvil queda pendiente; el resto del Inc 3 es paridad de calidad, no de funcionalidad.

- **Cierre (2026-10-25)**: conmutador de tema propio (sistema/claro/oscuro persistido) en la cabecera, gate `expo export --web` en CI y verificación de `Entrar` a 390. La suite móvil queda bloqueada por el arranque ESM de jest-expo; no se añadieron dependencias de test para no dejar un gate roto.

- **Límites cerrados (2026-10-26)**: Jest 30 no arranca con el setup ESM de RN 0.88; con Jest 29 y transformar todo `node_modules` la suite pasa (2 pruebas). El gate `expo export --web` vuelve a CI; `dangerouslyAllowAllBuilds` en `pnpm-workspace.yaml` deja que pnpm ejecute los builds nativos (se quitó `--ignore-scripts`).
