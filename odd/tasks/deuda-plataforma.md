# Deuda de plataforma web

**Objetivo**: cerrar la deuda que bloquea el resto de los incrementos: lint compartido, tema oscuro, ruta 404 y auditoría de accesibilidad.
**Rama**: `chore/plataforma-web` (apilada sobre `feat/inc-2-catalogo`) · **Runner**: `pnpm test`, `pnpm lint`, `pnpm build:web`.

## Specs

- **S1 — Lint compartido**: `packages/config` con ESLint flat, Prettier y reglas de frontera: prohibido `fetch`/`axios`/`superagent` en las apps, y `packages/core` sin React ni React Native. Gate en CI.
- **S2 — Tema oscuro con conmutador**: tres estados (sistema, claro, oscuro), persistidos en `localStorage`; el atributo `data-um-theme` fuerza el tema sobre `prefers-color-scheme`. El control vive en las cabeceras públicas y de sesión.
- **S3 — Ruta 404**: catch-all con el patrón de desenlace existente (cabecera + tarjeta), sin diseño nuevo.
- **S4 — Accesibilidad automatizada**: `axe` sobre catálogo y detalle en las pruebas de componentes; violaciones = fallo.

## Tareas

- [x] S1 · `packages/config` + scripts `lint`/`format:check` + gate en CI.
- [x] S2 · `tema.js`, `SelectorTema`, iconos y montaje en `main.jsx`, cabeceras y layout de sesión.
- [x] S3 · `NoEncontrado` y ruta `*`.
- [x] S4 · `vitest-axe` y pruebas de accesibilidad.

## Log

- **L1 (2026-10-22, verbatim)**: "podemos resolver primero la deuda tecnica, hazme preguntas"
- **Decisiones (2026-10-22)**: conmutador de tema persistido (no solo sistema), 404 con el patrón de desenlace, axe en pruebas de componentes, y este lote acotado a plataforma.
- **Verificación (2026-10-22)**: `pnpm lint` limpio (ESLint 9; ESLint 10 rompía `eslint-plugin-react`), **32** pruebas de la web (**102** en el workspace), `pnpm build:web` limpio. El provider de sesión pasó de refs en render a un inicializador de `useState`, que además elimina el aviso del compilador de React.
- **Formato (2026-10-24)**: Prettier aplicado a 71 archivos y `format:check` añadido al CI, con `.prettierignore` para generado, contrato, diseño y Markdown. El servidor de Vite del panel de Herdr quedó detenido.
