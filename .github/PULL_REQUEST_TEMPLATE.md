## Issue enlazada (obligatorio)

<!-- Closes/Fixes/Resolves #N cierra la issue al fusionar; Refs #N solo la referencia. -->
<!-- La issue debe estar en este repositorio y tener el label `status:approved`. -->

Closes #

## Tipo de PR (marca exactamente uno y añade su label)

- [ ] Bug fix → `type:bug`
- [ ] Nueva funcionalidad → `type:feature`
- [ ] Solo documentación → `type:docs`
- [ ] Refactor → `type:refactor`
- [ ] Mantenimiento / tooling → `type:chore`
- [ ] Cambio incompatible → `type:breaking-change`

## Resumen

<!-- 1–3 viñetas: qué hace este PR y por qué. -->

## Cambios

| Archivo | Cambio |
|---|---|
| `ruta/al/archivo` | Qué cambió |

## Plan de pruebas

Marca solo lo que ejecutaste y pasó:

- [ ] `pnpm test` — suite de todos los paquetes
- [ ] `pnpm contract:check` — el contrato coincide con su lock
- [ ] `pnpm api:check` — el cliente generado no deriva (requiere Java)
- [ ] `pnpm tokens:build` — sin deriva en `tokens.css`
- [ ] Probado manualmente en navegador o dispositivo

## Checklist

- [ ] Issue enlazada con `status:approved`
- [ ] Exactamente un label `type:*` aplicado
- [ ] Commits en formato Conventional Commits
- [ ] Sin trailers de atribución (`Co-Authored-By` ni similares)
- [ ] Si cambió el comportamiento, la documentación se actualizó en este PR
- [ ] El cliente HTTP sigue siendo el generado: no hay `fetch` a mano en las apps
