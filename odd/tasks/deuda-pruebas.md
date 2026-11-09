# Deuda de pruebas y tooling

**Objetivo**: cerrar las siete deudas abiertas en `uni-market-frontend` (#25–#31): niveles de prueba prometidos, cobertura móvil, accesibilidad automatizada, carrera de refresh entre pestañas, detección de deriva del contrato, cobertura del núcleo y rutas de la doc.
**Rama**: `chore/deuda-pruebas` · **Runner**: `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm test:coverage`.

## Specs

- **S1 (#30)**: gate de cobertura del núcleo ≥ 80 % de líneas en `packages/core` y `packages/api-client` (excluyendo `src/generado`), ejecutado en CI. Sin umbral para la UI.
- **S2 (#29)**: un comando detecta deriva del contrato vendorizado contra `uni-market-api` y falla citando la diferencia; sin el repo vecino no rompe CI.
- **S3 (#27)**: `axe` corre en las siete pantallas web sin auditoría (publicar, mis anuncios, editar, entrar, registro, recuperación, 404), con 0 violaciones.
- **S4 (#28)**: dos pestañas que arrancan a la vez hacen un solo `refresh`; la segunda adopta el par publicado y ninguna pierde la sesión.
- **S5 (#26)**: la app móvil recupera cobertura de catálogo y sesión con transporte falso, estable en CI.
- **S6 (#25)**: los niveles declarados en `docs/testing-strategy.md` existen: flujos con MSW y e2e con Playwright opt-in (`pnpm e2e`).
- **S7 (#31)**: las rutas y afirmaciones de `docs/testing-strategy.md` coinciden con el repo.

## Tareas

- [x] **T1 — Cobertura del núcleo (#30)**: scripts `test:coverage` en `core` y `api-client`, script raíz y paso en CI.
- [x] **T2 — Deriva del contrato (#29)**: `scripts/contract-drift.mjs` + `pnpm contract:drift`.
- [x] **T3 — axe (#27)**: pruebas de accesibilidad en las siete pantallas restantes.
- [x] **T4 — Refresh entre pestañas (#28)**: canal `BroadcastChannel` cableado en la web y prueba de dos gestores.
- [x] **T5 — Móvil (#26)**: pruebas de catálogo y sesión con transporte falso.
- [x] **T6 — MSW y e2e (#25)**: dependencias, flujos y directorio `apps/web/e2e` con script `pnpm e2e`.
- [x] **T7 — Doc (#31)**: rutas y afirmaciones de `docs/testing-strategy.md`.

## Log

- **L1 (2026-11-09, verbatim)**: "resuelta todas las issues"
- **T1 (#30, `abcafd9`)**: `test:coverage` mide core y api-client con `--test-coverage-lines=80` y el CI lo corre. Hoy 89,85 % en core y 100 % en api-client (sin el cliente generado).
- **T2 (#29, `61306df`)**: `pnpm contract:drift` compara el sha256 con el origen y cita commit y hashes; sin el repo de la API se omite.
- **T3 (#27, `b4cf5d0`)**: axe en entrar, registro, publicar, mis anuncios, editar, las tres de recuperación y la 404. 9 pruebas nuevas, 0 violaciones.
- **T4 (#28, `be0a32b`)**: ante un 401, si el almacén tiene otro refresh se adopta y se reintenta; la web cablea `BroadcastChannel`. Prueba con dos gestores: un solo refresh y ninguna sesión perdida.
- **T5 (#26, `30c79cd`)**: 6 pruebas en móvil (tema, almacén seguro y catálogo). La inestabilidad era que RTL 14 devuelve promesa en `render`: sin `await` se consultaba `screen` antes de tiempo.
- **T6 (#25, `2762409`)**: flujos MSW de sesión y catálogo, e2e con Playwright (`pnpm e2e`) verificado contra la API real con Chromium.
- **T7 (#31)**: la estrategia de pruebas describe rutas y niveles reales, y los gates de CI incluyen cobertura, formato y builds.
