# Uni Market — Frontend (web + móvil)

Monorepo del cliente de **Uni Market**, el marketplace universitario. Dos aplicaciones sobre el mismo núcleo: web (React) y móvil (React Native con Expo). El contrato es `openapi.yaml` del repositorio `uni-market-api`, y el cliente HTTP se **genera** desde él.

> **Estado actual**: ingeniería lista y revisable (diseño, contrato de integración, sistema de diseño y estrategia de pruebas), **paquete de tokens implementado y verificado** (`packages/design-tokens`, 23 pruebas en verde) y **archivo de diseño** en `design/uni-market.fig` con **9 páginas**: portada, fundamentos, catálogo y el flujo de sesión completo (`Entrar`, `Registro`, `Confirmar`, `Restablecer`, `Nueva contraseña`, `Reenviar`), cada vista con web, móvil y sus estados. **44 PNG** de verificación en `design/preview/`, frame por frame y agrupadas por página. El andamiaje de workspaces, el cliente generado y las primeras pantallas llegan en los incrementos de [`docs/frontend-design.md`](docs/frontend-design.md) §11. Los comandos de la tabla siguiente son el **contrato previsto** de scripts raíz: se implementan en el Inc 0.

## Estructura

```
apps/
  web/        React + Vite · JavaScript · CSS puro (CSS Modules)
  mobile/     React Native + Expo (Expo Router) · JavaScript
packages/
  api-client/ cliente generado desde el OpenAPI + transporte propio sobre fetch
  core/       sesión, errores, paginación, validación espejo, capacidades por rol, medios
  design-tokens/ una fuente de tokens → variables CSS (web) y objeto JS (móvil)
  config/     ESLint, Prettier y jsconfig compartidos
openapi/      contrato vendorizado + lock con su referencia de origen (Inc 0)
design/       uni-market.fig (OpenPencil) + preview/ con los PNG de verificación
docs/         diseño, integración con la API, sistema de diseño, pruebas
odd/tasks/    registro de trabajo por feature
```

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 24 o superior | Todo |
| pnpm | 12 o superior | Workspaces del monorepo |
| JDK | 21 o superior | `openapi-generator-cli` (el generador es Java) |
| API en marcha | `uni-market-api` en `http://localhost:8080/v1` | Desarrollo y pruebas de flujo |

El generador no requiere instalación global: se invoca con `npx` y descarga su CLI la primera vez.

## Comandos (previstos)

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala todos los workspaces |
| `pnpm contract:sync` | Actualiza `openapi/uni-market.yaml` desde la API y registra su origen |
| `pnpm api:generate` | Regenera el cliente HTTP a partir del contrato |
| `pnpm contract:check` | Verifica que el contrato no derive ni esté editado a mano |
| `pnpm tokens:build` | Regenera las variables CSS desde los tokens — **ya disponible sin workspaces**: `node packages/design-tokens/build.mjs` |
| `pnpm dev:web` | Desarrollo web (Vite) |
| `pnpm dev:mobile` | Desarrollo móvil (Expo) |
| `pnpm test` | Suite de paquetes y apps |
| `pnpm lint` | ESLint, incluidas las reglas de frontera entre paquetes |

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/frontend-design.md`](docs/frontend-design.md) | Alcance, usuarios, arquitectura del monorepo, decisiones D1–D16, pantallas, riesgos y plan de incrementos |
| [`docs/api-integration.md`](docs/api-integration.md) | Generación del cliente, sesión y refresh, errores, paginación, medios y subidas |
| [`docs/design-system.md`](docs/design-system.md) | Roles semánticos, tokens, convenciones de CSS puro, componentes y accesibilidad |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | Niveles de prueba, deriva de contrato y gates de CI |
| [`design/uni-market.fig`](design/uni-market.fig) | Archivo de diseño (OpenPencil): una página por vista, web y móvil con sus estados |
| [`design/preview/README.md`](design/preview/README.md) | Exportes SVG por vista y cómo regenerarlos |
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
