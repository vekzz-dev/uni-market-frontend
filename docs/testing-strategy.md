# Estrategia de pruebas — Uni Market (web + móvil)

Qué se prueba, con qué herramienta y qué se exige para dar algo por terminado. Principio rector: **probar el comportamiento que un usuario o un consumidor del paquete puede observar**, en el nivel más barato que lo capture. Sin teatros de cobertura ni suites que solo suben un número.

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Relacionado | [`frontend-design.md`](frontend-design.md) · [`api-integration.md`](api-integration.md) · [`design-system.md`](design-system.md) |
| Obligación de origen | "gate de cobertura: núcleo/dominio ≥ 80 % (los gates de UI pertenecen a los repos de clientes)" y "WCAG 2.2 AA verificable con clase de verificación declarada por requisito ... en web y móvil" — `uni-market-api/docs/prd.md:111-112` |

---

## 1. Niveles y herramientas

| Nivel | Qué prueba | Herramienta | Dónde |
|---|---|---|---|
| Unitario de dominio | Reglas puras: mapeo de errores, validación espejo, capacidades por rol, formateo, resolver de medios, lógica de cursor/offset | **Vitest** (entorno `node`) | `packages/core`, `packages/api-client` |
| Transporte / contrato del cliente | Que la envoltura arme bien rutas, query params, multipart y refresco de sesión | **Vitest** con transporte inyectado | `packages/api-client` |
| Componente y hook | Render, estados, accesibilidad básica, adaptadores de paginación | **Vitest + Testing Library** (`jsdom`) en web · **Jest (`jest-expo`) + React Native Testing Library** en móvil | `apps/web/src/**/__tests__`, `apps/mobile/src/**/__tests__` |
| Flujo integrado | Un recorrido completo con red simulada: registro → confirmar → login → refresh transparente → logout; catálogo con cursor; envío de mensaje + marcado de lectura | **MSW** (web) interceptando `fetch` · transporte falso inyectado (móvil) | `apps/*/src/**/__tests__/flujos` |
| Contrato | Que el cliente generado corresponda al `openapi.yaml` vendorizado y que este corresponda al origen fijado | `pnpm contract:check` (script propio + `openapi-generator-cli validate`) | CI y local |
| Extremo a extremo | Humo real navegador ↔ API local: explorar catálogo y completar un login | **Playwright** (opt-in, etiquetado) | `apps/web/e2e` |
| Accesibilidad | Automática (roles, etiquetas, contraste de componentes) y manual (teclado, foco, lector de pantalla) | `vitest-axe` en web · aserciones de `accessibilityRole`/`Label` en móvil · lista manual de `design-system.md` §7 | Ambas apps |
| Visual / responsive | Que no haya desbordes ni jerarquía rota a 1440×900 y 390×844 | Inspección manual con contenido real (largo, faltante, imágenes rotas) | Antes de cerrar cada incremento |

### 1.1 La costura que hace todo esto barato: transporte inyectable

`packages/api-client` expone las funciones de API **y** permite inyectar la función de transporte HTTP. Consecuencias directas:

- Las pruebas de `core` y de las apps **no** dependen de la red ni de un servidor levantado.
- En web, MSW intercepta `fetch` (más realista: prueba también el cliente generado).
- En móvil, donde interceptar `fetch` es frágil, se inyecta un transporte falso: mismo contrato, cero dependencia de detalles de red del entorno.

Esto es una decisión de diseño **al servicio de la prueba**: si el transporte no fuera inyectable, la mitad de los flujos de sesión no serían verificables sin un backend encendido.

---

## 2. Qué exige cada unidad de trabajo para cerrarse

| Tipo de cambio | Prueba mínima obligatoria |
|---|---|
| Regla de negocio del contrato (p. ej. `422` al editar contenido de un anuncio aprobado reinicia revisión, R6) | Un test unitario/integrado que la afirme, escrito **antes** (RED) y en verde después |
| Adaptador de paginación | Test de frontera: primera página, última página (`cursorSiguiente: null`), página vacía, cursor repetido |
| Sesión | Test de: refresh de vuelo único (dos `401` simultáneos → un solo refresh), refresh fallido → sesión anónima, `401` tras reintento → re-login |
| Capacidad por rol | Test por rol de la matriz (visible / oculto / deshabilitado) y que la vista **no** decida autorización |
| Pantalla nueva | Un test de flujo por su camino principal **y** uno por su estado vacío o de error |
| Tokens o tema | Diferencias de contraste comprobadas; `tokens:build` sin deriva |

No se exige un test por cada línea de JSX. Se exige que **cada afirmación sobre el contrato y cada regla con consecuencia visible** tenga una prueba que la sostenga.

---

## 3. Comandos por app y paquete

| Comando | Qué hace |
|---|---|
| `pnpm -r test` | Suite de todos los paquetes y apps |
| `pnpm --filter web test` | Vitest en web (unitario + componente + flujo con MSW) |
| `pnpm --filter mobile test` | Jest con `jest-expo` |
| `pnpm --filter core test` | Vitest del dominio compartido (sin React) |
| `pnpm e2e` | Playwright contra la API local (requiere la API arriba; etiquetado, no obligatorio para cada commit) |
| `pnpm lint` | ESLint (config compartida en `packages/config`), incluidas las reglas de frontera de dependencias (§4) |
| `pnpm contract:check` | Valida el contrato vendorizado y detecta deriva del cliente generado |
| `pnpm tokens:build` | Regenera `tokens.css` desde `design-tokens` |

---

## 4. Gates de CI (`.github/workflows/ci.yml`)

| Gate | Falla si |
|---|---|
| `lint` | ESLint reporta errores, o una app importa otra app, o `packages/*` importa `apps/*`, o `core` importa React/React Native |
| `test` | Algún test falla |
| `coverage-nucleo` | `packages/core` + `packages/api-client` bajan del **80 % de líneas** (obligación `prd.md:111`) |
| `contract-drift` | Regenerar el cliente produce diferencias, o `openapi/uni-market.yaml` difiere de la referencia registrada en el lock |
| `tokens-drift` | `tokens:build` produce un `tokens.css` distinto del commiteado |
| `build-web` | Vite no compila, o el bundle inicial de la ruta de catálogo supera el presupuesto de §5 |
| `no-hand-rolled-client` | Aparece una llamada HTTP directa fuera de `packages/api-client` (regla ESLint: `fetch`/`axios` prohibidos en `apps/*`) |

Los gates de UI **no** imponen un porcentaje de cobertura: exigir 80 % de cobertura en pantallas produce pruebas de render sin valor. Lo que se exige a la UI es la lista de §2 y la resolución de todos los estados de `design-system.md` §6.

---

## 5. Presupuestos de rendimiento (web)

| Métrica | Presupuesto propuesto | Por qué |
|---|---|---|
| JS inicial de la ruta de catálogo | ≤ 220 KB gzip | El catálogo es la primera impresión; es una lista, no una app pesada |
| Imágenes del catálogo | `srcset` + dimensiones declaradas + `loading="lazy"` salvo la primera fila | Evita saltos de layout, que se sienten como lentitud |
| Listas largas | Virtualización o paginación por cursor real (nunca traer 500 elementos) | El contrato ya ofrece cursor |
| LCP en portátil local | ≤ 2.5 s con la API en la misma máquina | Referencia medible sin inventar SLO de producción |
| Cambio de ruta | Sin bloqueo del hilo principal perceptible; carga diferida de rutas de operación (moderación, admin) | Esas rutas no las usa la mayoría |

Móvil: arranque en frío sin bloqueo perceptible y listas con `FlatList` (ventana y `keyExtractor` correctos); no se fija un número absoluto porque depende del dispositivo.

---

## 6. Plantilla de prueba (RED → GREEN)

```js
// 1. RED: describe el comportamiento observable con un nombre en inglés, no la implementación.
test('login keeps the session in memory and never stores the access token', async () => { /* ... */ })

// 2. GREEN: implementa lo mínimo que lo satisface.

// 3. Refactor con la suite en verde.
```

Reglas de nomenclatura y forma:

- Nombre en inglés, en tercera persona, describiendo el efecto observable: `returns the same message for a hidden and a missing listing`.
- Un `assert` principal por prueba; los secundarios solo si refuerzan el mismo comportamiento.
- Datos de prueba explícitos y **realistas** (precio, categoría, estado de revisión), nunca `foo`/`123`.
- Nunca se afirma sobre clases CSS ni sobre estructura interna; se afirma sobre texto visible, roles accesibles y datos enviados.
- Las pruebas **no** leen la fecha del sistema: el tiempo se inyecta.

---

## 7. Lo que deliberadamente no se prueba

| No se prueba | Motivo |
|---|---|
| Render de cada componente sin interacción | Prueba de fotografía frágil: se rompe con cada token y no detecta defectos reales |
| El framework de terceros (React Router, Expo Router) | No es nuestro código |
| Snapshot de CSS generado | Se verifica por deriva de tokens, no por contenido exacto |
| Los mensajes exactos del servidor | Son del contrato y pueden cambiar; se prueba la **clasificación** por estado |
| Reintentos de red con esperas reales | Se inyecta el tiempo; esperar hace la suite lenta y frágil |

---

## 8. Lint del archivo de diseño (OpenPencil)

El editor trae un lint propio (`lint`) que corre sobre el `.fig`. **Se evalúa por página**: para revisar una página concreta hay que pasarle su `page_id`; sin él devuelve la página activa, no el documento completo.

Estado verificado al 2026-10-20: `00 · Fundamentos` → **0 errores, 0 advertencias, 31 avisos**; `01 · Catálogo` → **0 errores, 0 advertencias, 184 avisos**; las seis páginas de sesión (`02`–`07`) → **0 errores, 0 advertencias**, con entre 33 y 58 avisos por página. Las cifras son de la página y cambian al editar; se verifican con `lint` pasando `page_id`.

Lo que **sí** se corrigió a partir del lint:

- Un **error de contraste** (3.90:1) en el botón deshabilitado. Aunque WCAG 1.4.3 exime a los componentes inactivos, se subió el texto a `#5B6370` (4.90:1) y en oscuro a `#AEB7C4` (5.09:1): el estado se comunica con el relleno gris y la falta de interacción, no con texto difícil de leer. Los tokens y las 23 pruebas se actualizaron con esa decisión.
- Una **advertencia de tamaño**: texto a 11 px, fuera de nuestra escala (mínimo 12).
- **117 capas** con nombre por defecto, renombradas por su contenido.
- Un **gap de 10 px** en la fila de la paleta, fuera de la rejilla de 4.

Avisos que se aceptan a propósito, con su motivo:

| Regla | Por qué se acepta |
|---|---|
| `pixel-perfect` | Centrar texto en contenedores de altura fija produce `x.5`/`y.5`. Redondear rompe el centrado real por medio píxel; el export lo antialiasa sin defecto visible |
| `no-deeply-nested` | La profundidad viene de la tarjeta (grilla → tarjeta → info → texto) y de los nodos internos de los iconos. Aplanarla destruye la estructura que necesita el código |
| `consistent-radius` | `999px` es nuestro token `pill`. La sugerencia del linter (`9999`) también está fuera de escala: aplicarla empeora el archivo |
| `consistent-spacing` | Los chips necesitan padding **horizontal** 10/14 y vertical 0. `set_layout` solo expone `padding` uniforme, que en CSS desbordaría un chip de 36 px con texto de 17 px |
| `prefer-auto-layout` | Frames internos de los iconos (`lucide:*`), no de nuestro layout |
| `touch-target-size` | La regla también marca **por nombre de capa**, no solo por tamaño: un icono decorativo llamado `link-2-off` se reportó como objetivo táctil de 22 px. Renombrar la capa a español lo resuelve sin tocar el glifo |

Regla operativa: **nunca ejecutar `lint_fix` a ciegas**. Su única sugerencia accionable es el radio `9999`, que contradice el token y ensancha el archivo. Las correcciones se aplican una por una, verificando el nodo después.
