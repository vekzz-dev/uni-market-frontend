# Uni Market — Frontend (web + móvil)

Monorepo del cliente de **Uni Market**, el marketplace universitario. Dos aplicaciones sobre el mismo núcleo: web (React) y móvil (React Native con Expo). El contrato es `openapi.yaml` del repositorio `uni-market-api`, y el cliente HTTP se **genera** desde él.

> **Estado actual**: **Inc 0 completo** y **flujo de sesión web (Inc 1) cerrado** — monorepo con workspaces de pnpm, contrato vendorizado con lock, **cliente HTTP generado** con transporte `fetch`, tokens Ember verificados, dominio completo (sesión con refresh de vuelo único, errores, paginación, validación espejo, capacidades, formato) y **app web** con las seis pantallas de sesión: entrar, registro, confirmar correo, restablecer, nueva contraseña y reenvío, más la portada provisional. **104 pruebas en verde** (`pnpm test`) y `vite build` limpio. El **archivo de diseño** tiene 10 páginas y 50 PNG en `design/preview/`. El catálogo y el detalle web están implementados contra la API real; la plataforma web ya tiene lint, tema oscuro con conmutador, 404 y auditoría `axe`. Falta el móvil.

## Estructura

```
apps/
  web/        ✅ (Inc 1) React 19 + Vite · JavaScript · CSS puro (CSS Modules) · 6 pantallas de sesión
  mobile/     (Inc 3) React Native + Expo (Expo Router) · JavaScript
packages/
  api-client/ ✅ cliente generado desde el OpenAPI + transporte propio sobre fetch
  core/       ✅ sesión, errores, paginación, validación espejo, capacidades, formato y medios
  design-tokens/ ✅ una fuente de tokens → variables CSS (web) y objeto JS (móvil)
  config/     ✅ ESLint flat, Prettier y reglas de frontera (sin fetch a mano, core sin React)
openapi/      ✅ contrato vendorizado + lock con su referencia de origen
design/       ✅ uni-market.fig (OpenPencil) + preview/ con los PNG de verificación
scripts/      ✅ contract:sync · contract:check · api:generate · api:check
docs/         ✅ diseño, integración con la API, sistema de diseño, pruebas
odd/tasks/    ✅ registro de trabajo por feature
```

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 24 o superior | Todo |
| pnpm | 12 o superior | Workspaces del monorepo |
| JDK | 21 o superior | `openapi-generator-cli` (el generador es Java) |
| API en marcha | `uni-market-api` en `http://localhost:8080/v1` | Desarrollo y pruebas de flujo |

El generador no requiere instalación global: se invoca con `npx` y descarga su CLI la primera vez.

La web lee la base de la API de `VITE_API_BASE_URL` (por defecto `http://localhost:8080/v1`); define esa variable en el entorno o en un `.env.local` de `apps/web/` si necesitas otro origen.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala los workspaces |
| `pnpm contract:sync` | Copia el contrato de la API y registra su origen (commit + sha256) en el lock |
| `pnpm contract:check` | Verifica que el contrato vendorizado coincide con su lock |
| `pnpm api:generate` | Regenera el cliente HTTP (requiere Java) |
| `pnpm api:check` | Regenera en un temporal y falla si el cliente deriva del contrato |
| `pnpm tokens:build` | Regenera `tokens.css` desde los tokens |
| `pnpm test` | Suite de todos los paquetes (hoy: tokens, api-client, core y web) |
| `pnpm dev:web` | Servidor de desarrollo de la web en `http://localhost:5173` |
| `pnpm build:web` | Build de producción de la web (incluye el `.woff2` de Inter) |
| `pnpm lint` | ESLint sobre el monorepo, con las reglas de frontera |
| `pnpm format:check` | Comprueba el formato con Prettier |

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/frontend-design.md`](docs/frontend-design.md) | Alcance, usuarios, arquitectura del monorepo, decisiones D1–D16, pantallas, riesgos y plan de incrementos |
| [`docs/api-integration.md`](docs/api-integration.md) | Generación del cliente, sesión y refresh, errores, paginación, medios y subidas |
| [`docs/design-system.md`](docs/design-system.md) | Roles semánticos, tokens, convenciones de CSS puro, componentes y accesibilidad |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | Niveles de prueba, deriva de contrato y gates de CI |
| [`design/uni-market.fig`](design/uni-market.fig) | Archivo de diseño (OpenPencil): una página por vista, web y móvil con sus estados |
| [`design/preview/README.md`](design/preview/README.md) | Exportes PNG por vista y cómo regenerarlos |
| [`odd/tasks/frontend-engineering.md`](odd/tasks/frontend-engineering.md) | Track de esta ingeniería, con evidencia |

Requisitos de producto, reglas de negocio (R1–R16) y esquema: repositorio `uni-market-api` (`docs/prd.md`, `docs/database-design.md`, `docs/system-design.md`). **No se duplican aquí.**

## Convenciones

- **JavaScript**, no TypeScript. **CSS puro** (CSS Modules) en web; `StyleSheet` alimentado por tokens en móvil.
- **Copy de interfaz en español**; identificadores, archivos y claves en inglés.
- **Prohibido escribir el cliente HTTP a mano**: toda llamada pasa por `packages/api-client`. Una regla de ESLint lo impone en las apps.
- **La autoridad de permisos es el servidor**: la interfaz oculta o deshabilita, nunca autoriza.
- **Conventional Commits**, sin atribución de IA en los mensajes.
- Sin secretos ni lógica privilegiada en el cliente.

## Licencia

MIT.
