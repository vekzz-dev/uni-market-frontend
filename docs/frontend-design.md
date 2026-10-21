# Diseño del frontend — Uni Market (web + móvil)

Documento de diseño del cliente de Uni Market: dos aplicaciones (web en React, móvil en React Native con Expo) sobre el contrato de `uni-market-api`. Es la fuente de verdad de la ingeniería del frontend; el detalle de cada área vive en los documentos enlazados al final.

| Campo | Valor |
|---|---|
| Estado | En curso — ingeniería, tokens y diseño de las primeras vistas; sin decisiones abiertas |
| Fecha | 2026-10-19 |
| Nivel documental | **Standard con sesgo riguroso** (§3) |
| Contrato | `uni-market-api/openapi.yaml` (fuente única de verdad, `/v1`) |
| Requisitos de producto | `uni-market-api/docs/prd.md` (R1–R16, §5, §7) — **no se duplican aquí** |
| Track | `odd/tasks/frontend-engineering.md` |

---

## 1. Qué se construye

Un cliente para un marketplace universitario con cuatro superficies:

- **Catálogo público** (sin sesión): explorar anuncios visibles, filtrar por categoría, buscar y abrir el detalle.
- **Cuenta y sesión**: registro con confirmación de email, login, restablecimiento de contraseña, perfil, avatar y baja.
- **Vendedor**: publicar anuncios con imágenes, seguir su estado de revisión, editar, pausar, marcar como vendido.
- **Operación**: mensajería comprador–vendedor, cola de moderación y panel de administración.

Se entrega en dos apps que comparten el mismo núcleo de dominio, el mismo cliente HTTP y los mismos tokens visuales: `apps/web` (React + Vite) y `apps/mobile` (Expo).

---

## 2. Contexto y restricciones

| Restricción | Consecuencia para el diseño |
|---|---|
| El contrato vive en otro repositorio y es la única fuente de verdad | El cliente se **genera**; una capa fina (no escrita a mano en su parte HTTP) adapta sesión, errores y paginación. §9 y `api-integration.md` |
| "Prohibidos clientes escritos a mano" (PRD §5) | Sin `fetch` suelto en las apps: toda llamada pasa por el paquete generado. Prohibido también en revisiones de código |
| Sin TypeScript; JavaScript con CSS puro | La seguridad de contrato no viene del compilador: viene del cliente generado, de la validación espejo en `core` y de las pruebas de contrato. `design-system.md` §2 |
| Dos plataformas, un producto | Todo lo que no sea render se comparte. La divergencia se limita a navegación, almacenamiento seguro y componentes nativos |
| El rol es autoridad del servidor, releído en cada request (R3) | La interfaz solo **oculta o deshabilita**; nunca decide. Una respuesta `403` debe ser tratada como caso normal, no como bug |
| Sin tiempo real, sin push (PRD §7) | La mensajería se refresca por acción del usuario o sondeo explícito; no se diseña UI de "escribiendo…" ni contadores vivos |
| Sin búsqueda insensible a acentos (PRD §7) | La caja de búsqueda no promete tolerancia a acentos ni corrige la consulta del usuario |
| `/media/**` sirve las imágenes y su forma depende del entorno | Se necesita un resolver de URLs. §6 D11 |

---

## 3. Nivel documental y por qué

**Standard con sesgo riguroso**, en cuatro documentos con dueño y frecuencia de cambio distintos:

| Documento | Dueño de qué | Cambia cuando |
|---|---|---|
| `docs/frontend-design.md` (este) | Alcance, usuarios, arquitectura del monorepo, decisiones D1–D16, slices | Cambia el alcance o una decisión de arquitectura |
| `docs/api-integration.md` | Codegen, sesión, errores, paginación, medios, subidas | Cambia el contrato o la estrategia de sesión |
| `docs/design-system.md` | Roles semánticos, tokens, convenciones CSS/`StyleSheet`, componentes, accesibilidad | Aparece un componente o un token nuevo |
| `docs/testing-strategy.md` | Niveles de prueba, deriva de contrato, gates de CI | Cambia el runner o un gate |

Por qué no un documento único: el sistema de diseño y el contrato de API los consumen **ambas** apps y se actualizan con frecuencia distinta a la arquitectura; un solo archivo se volvería un cuello de botella de revisión. Por qué no más documentos: no hay equipos separados, ni trazabilidad regulatoria, ni auditoría externa que justifiquen un ADR por decisión ni un documento por pantalla. Los requisitos de producto **no** se reescriben aquí: se citan por regla (`R#`) y se enlazan al PRD del backend.

---

## 4. Usuarios, capacidades y recorridos

### 4.1 Roles

| Rol | Puede |
|---|---|
| Visitante | Catálogo y detalle de anuncios visibles, registro, login, restablecimiento |
| `miembro` | Todo lo anterior + publicar y gestionar sus anuncios, conversar, perfil, avatar, baja |
| `moderador` | Todo lo de `miembro` + cola de moderación, decidir anuncios ajenos, CRUD de categorías |
| `admin` | Todo lo de `moderador` + listado de usuarios, cambio de rol, habilitar/inhabilitar |

Fuente: `uni-market-api/docs/prd.md:54-58`. Ninguna capacidad se implementa en el cliente sin existir en esa matriz; la matriz se traduce a un mapa de capacidades (`core/capacidades`) usado **solo** para ocultar o deshabilitar (`D13`).

### 4.2 Recorridos principales

1. **Alta**: registro → email de confirmación (token) → confirmar → login → catálogo. El login está bloqueado hasta confirmar.
2. **Vender**: publicar (multipart, 1..5 imágenes) → queda `pendiente` → moderación decide → si `aprobado`, el vendedor controla visibilidad → `vendido` cuando se concreta.
3. **Comprar/contactar**: catálogo → detalle → iniciar conversación → chatear. Una sola conversación por (anuncio, comprador); el anuncio propio no ofrece "contactar" (R9).
4. **Moderar**: cola FIFO de `pendiente` → abrir anuncio → aprobar o rechazar con motivo obligatorio. Nunca sobre el anuncio propio (403).
5. **Administrar**: listar usuarios y filtrar por rol → cambiar rol (no el propio) → habilitar/inhabilitar; CRUD de categorías.

### 4.3 Estados que toda pantalla con datos debe resolver

Carga (esqueleto, no spinner infinito) · vacío (con acción siguiente) · error recuperable (reintentar) · error de permiso (`403`) · no encontrado (`404`, y en catálogo **indistinguible** de invisible, R4) · sesión expirada (`401` tras reintento → re-login conservando el destino) · límite de tasa (`429`, con copy fijo, `D9`) · éxito · deshabilitado por regla de negocio (p. ej. visibilidad solo sobre `aprobado`) · sin conexión (móvil y web offline: mensaje honesto, sin prometer reintento automático).

---

## 5. Arquitectura del monorepo

```
uni-market-frontend/
├─ apps/
│  ├─ web/                     React 19 + Vite · CSS Modules puro · React Router
│  └─ mobile/                  Expo (SDK 58) + Expo Router · StyleSheet
├─ packages/
│  ├─ api-client/              cliente generado (openapi-generator) + envoltura fina
│  ├─ core/                    dominio compartido: sesión, errores, paginación, validación espejo, capacidades, formateo, resolver de medios
│  ├─ design-tokens/           tokens en JS → tokens.css (web) + objeto JS (móvil)
│  └─ config/                  eslint + prettier + jsconfig compartidos
├─ openapi/uni-market.yaml     contrato vendorizado + lock con la referencia de origen (Inc 0)
├─ design/                     uni-market.fig (OpenPencil) + preview/ de verificación
├─ scripts/                    contract:sync · contract:check · tokens:build
├─ docs/                       frontend-design · design-system · api-integration · testing-strategy
├─ odd/tasks/                  registro de trabajo por feature
└─ README.md
```

**Regla de dependencias** (verificable por lint, ver `testing-strategy.md`): `apps/*` dependen de `packages/*`; `packages/*` **nunca** dependen de `apps/*`; `core` no importa React ni React Native (debe poder ejecutarse en Node para sus propias pruebas); `design-tokens` no importa nada.

### 5.1 Qué se comparte y qué no

| Compartido (`packages/`) | Específico de cada app |
|---|---|
| Llamadas HTTP tipadas por el contrato, sesión y refresh, mapeo de errores a copy, adaptadores de paginación, validación espejo, capacidades por rol, formateo de precio/fecha, resolver de URLs de medios, tokens | Navegación y rutas, almacenamiento seguro del refresh, componentes de presentación, estado de pantalla, subida de archivos, accesibilidad específica de plataforma |

---

## 6. Decisiones técnicas

Cada decisión nombra el problema, la elección, la alternativa y su costo. Las decisiones de sesión, contrato y subidas se detallan en `api-integration.md`.

| # | Decisión | Elección | Alternativa y costo |
|---|---|---|---|
| **D1** | Gestor de paquetes y workspaces | **pnpm workspaces** (pnpm 12.8.1 ya instalado), `.npmrc` con `node-linker=hoisted` para compatibilidad de Metro/Expo | npm workspaces: cero fricción con Expo pero resolución más laxa y sin `workspace:` protocol. Si Metro da problemas, cambiar a npm es una migración corta en un repo joven |
| **D2** | Bundler web | **Vite** (8.x) | Next.js: SSR/SEO para un catálogo público, pero exige un servidor Node, manejo de secretos y un modelo mental extra para un proyecto de curso; el contrato es JWT Bearer con CORS de navegador, sin cookies ni sesión de servidor |
| **D3** | Navegación web | **React Router** (rutas con URL: filtros, búsqueda y paginación del catálogo son parte de la URL) | Estado en memoria: se pierde el enlace compartible y el botón "atrás" del navegador |
| **D4** | Navegación móvil | **Expo Router** (basado en archivos) | React Navigation manual: más control, más código de registro y sin rutas por archivo |
| **D5** | Estilos | **CSS puro con CSS Modules + variables CSS** generadas desde `design-tokens` | Un único CSS global con BEM: válido, pero sin aislamiento real entre features. Tailwind o CSS-in-JS: prohibidos por el pedido ("css puro") |
| **D6** | Estilos móviles | `StyleSheet.create` alimentado por el **mismo objeto de tokens** | Duplicar valores a mano: garantiza divergencia visual entre web y móvil |
| **D7** | Estado de servidor | Capa fina propia en `core` sobre el cliente generado (funciones `cargar*` + hooks `usar*`), sin librería de caché | TanStack Query: potente, pero añade un modelo de caché completo para un dominio con paginación por cursor que igual hay que adaptar |
| **D8** | Estado de sesión | Contexto de React + token de acceso **en memoria** + refresh persistido, con refresh de vuelo único | Persistir el access token: contradice el contrato y multiplica el daño de un XSS |
| **D9** | Errores | Mapeo único `problema → mensaje de usuario` en `core`, con tabla por estado HTTP | Mostrar `title`/`detail` crudos: filtra internals y, en `429`, no existe `Retry-After` que explicar |
| **D10** | Paginación | Dos adaptadores: cursor (catálogo, historial de mensajes) y offset (paneles) | Un solo adaptador: el contrato usa los dos modos a propósito (`openapi.yaml:1104-1128`) |
| **D11** | URLs de medios | Resolver: absoluta se usa tal cual; relativa se prefija con el origen de la API | Confiar en la forma recibida: en dev es relativa (`/media/...`) y en prod absoluta (R2), y una imagen rota no dice por qué |
| **D12** | Código generado | Generado con `openapi-generator-cli` (Java 25 disponible) **commiteado** + script de regeneración y comprobación de deriva en CI | Generar en cada build: builds lentos y fallos opacos; no commitear y generar al instalar: el diff del contrato deja de ser visible en revisión |
| **D13** | Permisos en la interfaz | Mapa de capacidades que oculta o deshabilita, más manejo explícito de `403` como caso normal | Confiar en el cliente para autorizar: no autoriza nada (R3). Ocultar sin manejar `403`: cualquier cambio de rol en caliente rompe la pantalla |
| **D14** | Idioma de la interfaz | Todo el copy en **español** (obligación del PRD §5); identificadores, nombres de archivo y claves de API en inglés | Copy en inglés: incumple la obligación del producto |
| **D15** | Configuración por entorno | Web: `VITE_API_BASE_URL`. Móvil: `EXPO_PUBLIC_API_BASE_URL`. El origen de medios y el prefijo `/v1` se derivan de esa base | Duplicar la URL de medios como variable aparte: dos fuentes que se desincronizan |
| **D16** | Trazabilidad de errores | Cada error de API conserva el `X-Request-Id` de la respuesta y se muestra en el detalle técnico | Perder el identificador: convierte un bug reportado en una búsqueda a ciegas en los logs del backend |
| **D17** | Identidad visual | **Ember adoptada** (naranja de acción sobre neutros cálidos) con las correcciones que exigió la medición de contraste, y tema oscuro derivado de la misma familia cromática | Mantener los valores originales: cuatro defectos AA (texto secundario 4.39:1, hover del botón 3.56:1, foco 2.80:1, borde de campo 1.47:1) incompatibles con la obligación de accesibilidad del PRD |
| **D18** | Formato de precio | **USD (`$`)** con `Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })`, idéntico en web y móvil | El contrato no expone moneda: el precio es un `number` pelado (`openapi.yaml:1386-1391`). Alternativa: multi-moneda — exigiría un campo nuevo en la API y no está en el alcance del producto |
| **D19** | Tipografía del producto | **Inter autoalojada** (woff2 propio, `font-display: swap`) con la pila del sistema como respaldo | CDN de fuentes: dependencia externa y privacidad por una sola fuente. Pila del sistema sola: el producto se aleja del diseño que se revisa |

### 6.1 Decisiones heredadas del contrato que el cliente **no** puede reinterpretar

- El rol y los permisos son del servidor y se releen en cada request (R3): el cliente puede estar desactualizado y debe fallar con elegancia.
- Un anuncio no visible responde `404` idéntico a uno inexistente (R4): la interfaz debe dar el mismo mensaje, sin pistas.
- Los errores `401` son indistinguibles entre sesión ausente, cuenta deshabilitada o baja (R13/R15): el copy no debe intentar adivinar la causa.
- La búsqueda de catálogo usa `q` con escape de comodines; el cliente no debe añadir filtrado local que oculte resultados del servidor.
- Editar el contenido de un anuncio `aprobado` o `rechazado` lo devuelve a `pendiente` (R6): la interfaz **avisa antes** de guardar.

---

## 7. Mapa de pantallas

### Web (`apps/web`)

| Ruta | Pantalla | Sesión |
|---|---|---|
| `/` | Catálogo: grid, filtro por categoría, orden, búsqueda, cursor infinito | Pública |
| `/anuncios/:id` | Detalle: galería, precio, descripción, vendedor, acción "contactar" | Pública (la acción exige sesión) |
| `/entrar`, `/registro` | Login y registro | Pública |
| `/confirmar-email` | Confirmación por token (lee el token de la URL) | Pública |
| `/restablecer` | Solicitar y confirmar restablecimiento | Pública |
| `/mis-anuncios` | Panel offset con badge de revisión y `motivoRechazo` | `miembro`+ |
| `/mis-anuncios/nuevo`, `/mis-anuncios/:id/editar` | Alta y edición multipart | `miembro`+ |
| `/mensajes`, `/mensajes/:id` | Lista de conversaciones e hilo con envío y marcado de lectura explícito | `miembro`+ |
| `/perfil` | Nombre, avatar, contraseña, baja | `miembro`+ |
| `/moderacion` | Cola FIFO y decisión con motivo | `moderador`+ |
| `/admin/usuarios`, `/admin/categorias` | Listado y acciones de administración | `admin` |

### Móvil (`apps/mobile`)

Mismas capacidades con navegación por pestañas: **Explorar** (catálogo y detalle), **Mensajes**, **Vender** (`mis-anuncios` y alta), **Perfil**; moderación y administración viven dentro de Perfil y solo aparecen con la capacidad correspondiente. Las pantallas públicas de sesión (entrar, registro, confirmar, restablecer) se presentan fuera de las pestañas.

---

## 8. Dirección visual

**Tesis adoptada**: el producto se juzga por sus fotos y su precio, así que la interfaz debe ser un **catálogo legible y denso en información, no una landing**. Jerarquía por contenido (imagen → precio → título → vendedor), superficies planas con bordes y sin sombras decorativas, y un único acento reservado a acciones primarias y estados.

Principios verificables:

1. La imagen del anuncio y su precio dominan el orden de lectura; el resto acompaña.
2. Un solo acento cromático; los estados (`pendiente`, `aprobado`, `rechazado`, `vendido`) se distinguen por texto e icono además de color.
3. Densidad útil: la cuadrícula del catálogo muestra más de cuatro tarjetas en un portátil, no una tarjeta gigante con degradado.
4. Cero decoración no funcional: sin gradientes decorativos, sin glassmorphism, sin blobs, sin emojis como iconos de interfaz (el emoji pertenece a la categoría, que es dato del servidor).
5. Nada se anima si el usuario pidió movimiento reducido (`prefers-reduced-motion`, y en móvil el ajuste equivalente).

La identidad adoptada es **Ember**: naranja como color de acción sobre neutros cálidos, con tema claro y oscuro derivado de la misma familia. Los valores concretos, las correcciones de accesibilidad y las reglas que de ellos se derivan viven en [`design-system.md`](design-system.md) §2 — aquí no se duplican. Dos reglas valen como dirección y no como detalle: el naranja relleno aparece **una vez por pantalla** (en el catálogo, menos que el 10% del 60-30-10, porque las fotos ya aportan el color), y en oscuro el naranja se **aclara**, nunca se oscurece.

El diseño visual vive en OpenPencil, en **`design/uni-market.fig`**, organizado por **flujo**, no por vista suelta:

| Página | Contiene |
|---|---|
| `Cover` | Portada del archivo (es la que OpenPencil usa como miniatura) |
| `00 · Fundamentos` | Botones, insignias de estado, campos y paleta |
| `01 · Catálogo` | `Catálogo · web`, `Catálogo · móvil` y los estados `vacío` y `error` |
| `02 · Entrar` | Los 3 estados en web y móvil, con el enlace a `Reenviar` |
| `03 · Registro` | default, `conflicto`, `enviado` |
| `04 · Confirmar` | `verificando`, `confirmado`, `inválido` |
| `05 · Restablecer` | default, `enviado`, `límite` |
| `06 · Nueva contraseña` | default, `inválido`, `listo` |
| `07 · Reenviar` | default, `enviado`, `límite` |

**Convención**: una página por vista; cada página contiene el frame web a la izquierda, el móvil a la derecha y los estados debajo de cada uno. Nombres de frame: `Vista · plataforma · estado`.

Convención de nombres de frame: **`Flujo · plataforma · estado`** (`Catálogo · web`, `Catálogo · móvil · vacío`); cuando no hay estado, el último segmento se omite. Los exportes de verificación están en `design/preview/` (uno por vista, frame por frame; móvil a 2×); la composición responsive está normada en [`design-system.md`](design-system.md) §8.

---

## 9. Contrato con la API (resumen)

| Tema | Regla que el cliente debe respetar | Detalle |
|---|---|---|
| Origen | `/v1`; rutas en plural kebab-case; campos en `camelCase` | `api-integration.md` §1 |
| Colecciones | Siempre `{datos, paginacion}`; cursor en catálogo y mensajes (hacia atrás), offset en paneles | §4 |
| Errores | `application/problem+json`; `400` estructura, `422` regla de negocio, `401` genérico, `403` permiso, `404` inexistente o no visible, `409` duplicado, `429` límite; **sin** código de máquina | §3 |
| Sesión | Access 15 min en memoria; refresh 30 días persistido y rotado; el reuso revoca la familia completa → re-login forzado | §2 |
| Subidas | Solo multipart: `imagenes` (1..5, 5 MB) al crear, `archivo` (2 MB) para avatar; el tipo real se detecta por *magic bytes* | §6 |
| Medios | Publicados por la API; nunca se construye una URL a mano | §5 |

---

## 10. Riesgos y preguntas abiertas

| # | Tipo | Descripción | Acción propuesta |
|---|---|---|---|
| **Q-REPO** | Resuelta (2026-10-20) — desviación aceptada | El PRD del backend dice "cada app en su repositorio propio"; este monorepo agrupa los dos clientes. Se decidió **no tocar el repo de la API** y documentar la desviación aquí | La intención que el PRD protege (la API es exclusivamente backend, sin JS ni tooling frontend) se respeta. La diferencia es la agrupación web+móvil, registrada en §5 |
| **Q-BRAND** | Resuelta (2026-10-19) | Identidad **Ember** entregada por el usuario y adoptada con las correcciones que exigió la medición de contraste | Sin acción pendiente: valores en `packages/design-tokens/src/semantic.js`, verificados por 23 pruebas |
| **Q-FONT** | Resuelta (2026-10-20) | El archivo de diseño usa **Inter** y el producto también: se adopta **Inter autoalojada** (woff2 propio, `font-display: swap`, pila del sistema como respaldo) | Sin CDN de fuentes. El archivo `.woff2` entra con las apps en el Inc 0; el token ya apunta a Inter |
| **Q-DRIFT** | Resuelta (2026-10-20) | `openapi.yaml` declara `AnuncioResumen` sin `estado` ni `fechaActualizacion`, pero el catálogo los envía. Reportado con captura real en **`vekzz-dev/uni-market-api#1`** | El cliente ya no depende de esos campos. **No** se parchea el cliente generado: la corrección va en el contrato |
| **R-1** | Riesgo | Rotación de refresh + varias pestañas: dos pestañas pueden refrescar a la vez y una reutiliza un token ya rotado → revocación de familia y expulsión | Coordinación con `BroadcastChannel` y almacenamiento compartido; `api-integration.md` §2.3 |
| **R-2** | Riesgo | CORS en producción está vacío por defecto: el navegador fallará hasta que se declare el origen | Registrar el origen web como requisito de despliegue; el móvil no depende de CORS |
| **R-3** | Riesgo | Sin `Retry-After` en `429`: la interfaz no puede decir cuánto falta | Copy fijo ("espera un minuto") y deshabilitar el envío mientras se muestra; no inventar cuenta atrás |
| **R-4** | Riesgo | El tipo de imagen se valida por *magic bytes*: renombrar un archivo falla con `422` | Pre-validación de tamaño y cantidad en el cliente; mensaje claro si el servidor rechaza por tipo |
| **R-5** | Riesgo | El `Location` de la creación de anuncios es relativo y es el único header expuesto por CORS | Usar el `id` del cuerpo/`Location` con cuidado: preferir datos del cuerpo y no depender de headers extra |
| **R-6** | Riesgo | El borrado de cuenta es lógico y "cortar sesión" no invalida el access token vivo | Al dar de baja: limpiar almacenamiento local y navegar fuera; no prometer revocación inmediata |

---

## 11. Plan de entrega (slices verticales)

Cada incremento entrega una capacidad visible completa y verificable, con web primero (el ciclo de desarrollo en navegador es más rápido y prueba los paquetes compartidos) y el móvil en paridad después.

| Inc | Contenido | Salida observable |
|---|---|---|
| **Inc 0** | Monorepo: workspaces, configs, tokens, `contract:sync`, cliente generado y comprobación de deriva, CI | `pnpm install && pnpm api:check && pnpm tokens:build` en verde, sin UI |
| **Inc 1** | Sistema de diseño mínimo + núcleo de sesión + pantallas de sesión web | Registro → confirmar → login → refresh transparente → logout, probado con MSW |
| **Inc 2** | Catálogo público web + detalle | Explorar, filtrar y abrir un anuncio con cursor infinito |
| **Inc 3** | Shell móvil + paridad de sesión y catálogo | App Expo con flujo de sesión y catálogo funcionando |
| **Inc 4** | Vendedor web | Publicar con imágenes, ver estado de revisión, editar, visibilidad, vendido |
| **Inc 5** | Mensajería web | Conversaciones, hilo con cursor hacia atrás, envío y marcado de lectura |
| **Inc 6** | Perfil web | Nombre, avatar, contraseña, baja |
| **Inc 7** | Moderación web | Cola FIFO, decisión con motivo, `403` en anuncio propio |
| **Inc 8** | Administración web | Usuarios, rol, habilitación, CRUD de categorías |
| **Inc 9** | Paridad móvil de Inc 4–8 + endurecimiento | Accesibilidad, presupuestos de rendimiento y humo e2e |

Cada incremento cierra con sus pruebas propias (ver `testing-strategy.md`) y con la lista de estados de §4.3 resuelta para sus pantallas.

---

## 12. Documentos relacionados

- `uni-market-api/openapi.yaml` — contrato (fuente única de verdad).
- `uni-market-api/docs/prd.md` — R1–R16, obligaciones de clientes (§5), no-objetivos (§7).
- `uni-market-api/docs/system-design.md` — decisiones del backend que explican el contrato.
- [`api-integration.md`](api-integration.md) — codegen, sesión, errores, paginación, medios y subidas.
- [`design-system.md`](design-system.md) — tokens, CSS puro, componentes, accesibilidad.
- [`testing-strategy.md`](testing-strategy.md) — niveles de prueba y gates de CI.
- [`../odd/tasks/frontend-engineering.md`](../odd/tasks/frontend-engineering.md) — track de esta ingeniería.
