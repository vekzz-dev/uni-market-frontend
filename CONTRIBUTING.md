# Contribuir — Uni Market (frontend)

Monorepo de los clientes web y móvil. La API vive en `uni-market-api`; su `openapi.yaml` es la fuente de verdad del contrato.

## Flujo de trabajo

1. **Issue primero**: abre una issue en este repositorio. El trabajo empieza cuando tiene el label `status:approved`.
2. **Rama**: `tipo/descripcion` en minúsculas, p. ej. `feat/catalogo-web`.
3. **Commits**: Conventional Commits (`feat(scope): …`, `fix(scope): …`, `docs: …`, `chore: …`). Sin atribución de IA.
4. **PR**: usa `.github/PULL_REQUEST_TEMPLATE.md`, enlaza la issue con `Closes/Fixes/Resolves #N` o `Refs #N` y aplica **exactamente un** label `type:*`.

## Tipos de rama

`feat/`, `fix/`, `chore/`, `docs/`, `style/`, `refactor/`, `perf/`, `test/`, `build/`, `ci/`, `revert/`.

## Convenciones técnicas

- **JavaScript, no TypeScript.** Web con CSS puro (CSS Modules); móvil con `StyleSheet` alimentado por tokens.
- **Copy de interfaz en español**; identificadores y nombres de archivo en inglés.
- **Nada de clientes HTTP a mano**: toda llamada pasa por `packages/api-client`, generado desde el contrato. Prohibido `fetch`/`axios` en `apps/*`.
- **Los permisos los decide el servidor**: la interfaz oculta o deshabilita, nunca autoriza.
- **Tokens**: ningún literal de color, espacio o radio fuera de `packages/design-tokens`.
- **El contrato no se parchea**: si falta un campo, se corrige en `openapi.yaml` de la API, no en el cliente generado.

## Antes de abrir un PR

```bash
pnpm test
pnpm contract:check
pnpm api:check      # requiere Java
pnpm tokens:build   # y comprobar que no hay deriva
```

Si cambiaste el contrato: `pnpm contract:sync`, `pnpm api:generate` y commitea ambos.

## Estructura

`apps/` (web, mobile) · `packages/` (api-client, core, design-tokens, config) · `openapi/` (contrato + lock) · `docs/` (diseño) · `design/` (archivo y previews) · `odd/tasks/` (track por feature).
