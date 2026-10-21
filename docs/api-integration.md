# Integración con la API — Uni Market (web + móvil)

Cómo las apps hablan con `uni-market-api`: generación del cliente desde el contrato, ciclo de vida de la sesión, traducción de errores, paginación, medios y subidas. Este documento es el contrato interno de `packages/api-client` y `packages/core`.

| Campo | Valor |
|---|---|
| Estado | Propuesto (verificado: el generador funciona contra el spec real) |
| Contrato | `uni-market-api/openapi.yaml` — **OpenAPI 3.1.0**, base `/v1` |
| Relacionado | [`frontend-design.md`](frontend-design.md) §6 y §9 · [`testing-strategy.md`](testing-strategy.md) §1 |

---

## 1. Cliente generado: pipeline y límites

### 1.1 Hecho verificado (2026-10-19)

Se ejecutó `@openapitools/openapi-generator-cli@2.41.0` (CLI **7.26.0**) sobre el `openapi.yaml` real:

- Genera sin errores el cliente completo: **9 módulos** (`AuthApi`, `UsuariosApi`, `CatalogoApi`, `AnunciosApi`, `CategoriasApi`, `ConversacionesApi`, `MensajesApi`, `ModeracionApi`, `AdministracionApi`) + ~40 modelos + documentación.
- Los métodos se nombran por `operationId` en español: `buscarCatalogo(opts)`, `leerAnuncio(anuncioId)`, y cada uno tiene su variante `...WithHttpInfo`.
- Los módulos son clases ES6 con **inyección del transporte**: `export default class CatalogoApi { constructor(apiClient) { ... } }`.
- El transporte que trae por defecto es **`superagent@^5.3.0`**, con `@babel/cli` como dependencia de ejecución y un paso de build `babel src -d dist`.
- Los modelos construyen sus campos con una **lista blanca**: `if (data.hasOwnProperty('campo'))`. Los campos que el contrato no declara **se descartan**.

### 1.2 Consecuencias de diseño

| Hallazgo | Decisión |
|---|---|
| `superagent@5` + `@babel/cli` como dependencias de ejecución | **No** se usa el `package.json` generado. El paquete es nuestro (`packages/api-client/package.json`) y el manifiesto generado se ignora |
| `superagent` v5 es antiguo y su comportamiento en React Native es una incógnita (React Native no es su entorno de pruebas) | Se **conserva todo el código generado (modelos + métodos de API)** y se sustituye **solo la capa de transporte** por una implementación propia basada en `fetch`, que expone la misma superficie que los módulos y modelos generados consumen |
| La superficie a implementar es acotada y conocida | `callApi(...)`, `selectHeaderAccept`, `isJsonMime`, `deserialize`, `convertToType` y `constructFromObject` (estáticas, usadas por los modelos), más un singleton `instance` con `basePath`, `authentications.bearerAuth`, `defaultHeaders` y `timeout` |
| El transporte está inyectado por constructor en los módulos generados | El intercambio es un punto de extensión **previsto por el propio generador**, no un parche: en Inc 0 se prueba el cliente generado contra el transporte `fetch` |

**Límite explícito**: escribir a mano los métodos de API está prohibido (PRD §5). Lo que se escribe a mano es el transporte —una capa genérica, sin conocimiento de las rutas del dominio— y la envoltura de sesión/errores. Nada del dominio se reimplementa.

### 1.3 Estructura del paquete

```
packages/api-client/                 ← solo transporte y contrato; sin reglas de dominio
├─ src/
│  ├─ generado/            ← api/ y model/ SOLO los escribe el generador
│  │  ├─ api/             los 9 módulos
│  │  ├─ model/           los modelos
│  │  └─ ApiClient.js     transporte propio sobre fetch (excluido de la generación)
│  ├─ problemas.js         forma del error: ApiError con problem+json y X-Request-Id
│  └─ index.js             crearCliente(): baseUrl, token en memoria, fetch, timeout
├─ test/transporte.test.mjs  fetch falso: URL, auth, multipart, problem+json, 204
├─ .openapi-generator-ignore   qué NO se copia del generador (ApiClient.js, docs, tests, babel…)
└─ README.md

packages/core/                       ← dominio compartido; depende de api-client, nunca al revés
├─ src/sesion/             máquina de estados, refresh de vuelo único, almacenes por plataforma
├─ src/errores/            tabla §3.2 (única fuente de copy de error)
├─ src/paginacion/         adaptadores y hooks de cursor/offset
├─ src/validacion/         validación espejo (§3.3)
├─ src/capacidades/        matriz rol → capacidad (ocultar/deshabilitar)
├─ src/medios/             resolver de URLs (§5)
└─ src/formato/            precio, fecha, texto
```

### 1.4 Sincronización y deriva

| Script | Hace |
|---|---|
| `pnpm contract:sync` | Copia el `openapi.yaml` de origen (`OPENAPI_SOURCE` o `../uni-market-api/openapi.yaml`) a `openapi/uni-market.yaml` y escribe `openapi/CONTRACT.lock.json` con la etiqueta de origen, el commit de la API, `info.version`, el **sha256** y la fecha |
| `pnpm api:generate` | Genera con `openapi-generator-cli` en un temporal, copia solo `src/api` y `src/model`, **normaliza los imports a ESM con `.js`** (el generador los emite sin extensión y Node no los resuelve) y descarta el `ApiClient.js` de superagent |
| `pnpm contract:check` | Compara el **sha256** del contrato vendorizado con el lock. No necesita red ni el repo de la API |
| `pnpm api:check` | Regenera en un temporal y compara **archivo por archivo** con lo commiteado; falla ante cualquier deriva. No depende de git ni modifica el árbol |

Reglas:

1. El contrato se **vendoriza** (`openapi/uni-market.yaml`): el build no depende de la red ni de un repositorio vecino.
2. `src/generado/**` está **commiteado**: el diff del contrato es visible en revisión.
3. CI regenera y **falla ante cualquier deriva**, lo que hace imposible mantener una edición manual.
4. Cualquier campo que la interfaz necesite y el contrato no declare se resuelve **en el contrato**, nunca parcheando el cliente generado.

---

## 2. Sesión

### 2.1 Modelo de tokens (obligación del contrato)

| Elemento | Regla | Evidencia |
|---|---|---|
| `accessToken` | JWT HS256, 15 min. Vive **solo en memoria**. Nunca en `localStorage` | `openapi.yaml:1061-1065`, `1329-1332` |
| `refreshToken` | Opaco, 30 días, **persistido** (web: `localStorage`; móvil: almacén seguro del sistema) | `docs/prd.md:81` |
| `expiraEnSegundos` | Viene en la respuesta de login/refresh: el cliente programa su refresco proactivo | `openapi.yaml:1323-1337` |
| Rotación | Cada refresh emite un par nuevo; el anterior deja de servir | `openapi.yaml:68-92` |
| Reuso | Reutilizar un refresh ya rotado → `401` y **revocación de toda la familia** → re-login forzado | `docs/prd.md:81` |

### 2.2 Máquina de estados

```
anonimo ──login/refresh──▶ autenticado ──401 irreversible──▶ expirado ──login──▶ autenticado
   ▲                            │
   └────────logout / baja───────┘
```

Reglas de implementación:

1. **Refresco proactivo**: si al token le quedan menos de 60 s, se refresca antes de enviar la petición. Evita gastar un `401` en cada llamada.
2. **Refresco reactivo de vuelo único**: ante un `401`, se lanza **una** promesa de refresh compartida por proceso. Todas las peticiones en vuelo esperan esa misma promesa y reintentan **una sola vez**. Un segundo `401` tras el reintento es irreversible → estado `expirado`, se limpia el almacenamiento y se navega a login conservando la ruta destino.
3. **Nunca** se reintenta una petición de `auth/login`, `auth/refresh` ni `auth/logout` por el mecanismo anterior (evita bucles).
4. **Logout**: se llama a `POST /auth/logout` con el refresh; el contrato responde siempre `204`. El estado local se limpia **aunque la llamada falle** (el access token vivo no se puede revocar: no se promete lo contrario en la interfaz).
5. **Baja de cuenta** (`DELETE /usuarios/me`): el borrado es lógico y la sesión se corta en el cliente de inmediato.

### 2.3 Coordinación entre pestañas (riesgo R-1)

La rotación con detección de reuso convierte un detalle de implementación en un problema real: si dos pestañas refrescan a la vez con el mismo token, la segunda reutiliza un token ya rotado y el servidor revoca la familia entera → el usuario es expulsado de todas.

Solución: **elección de líder**.

1. Las pestañas se comunican por `BroadcastChannel` (con `storage` como respaldo).
2. Solo la pestaña líder refresca; publica el par nuevo y las demás lo adoptan.
3. El refresh persistido se escribe **antes** de publicar el evento, y toda pestaña relee el almacenamiento antes de usarlo (nunca confía en su copia en memoria más allá del access token).
4. Si el líder desaparece, cualquier pestaña puede tomar el relevo (arriendo con vencimiento, no candado permanente).

El móvil no necesita nada de esto: es un solo proceso.

---

## 3. Errores

### 3.1 Forma

Los errores llegan como `application/problem+json` con `{type, title, status, detail}` (`openapi.yaml:1223-1241`). El cliente generado **descarta** `instance` porque el contrato no lo declara (lista blanca de §1.1). El `X-Request-Id` viaja en la **cabecera**, no en el cuerpo, y es lo único que permite correlacionar con los logs del backend: `problemas.js` lo conserva y `D16` lo muestra en el detalle técnico.

**No existe código de error de máquina.** Por lo tanto la clasificación se hace por **estado HTTP**, y el texto del servidor solo se usa como detalle cuando es una regla de negocio (`422`) que el usuario debe leer.

### 3.2 Tabla de traducción a copy de interfaz

| Estado | Significado (`openapi.yaml:14-15`) | Copy propuesto |
|---|---|---|
| `400` | Problema estructural: JSON inválido, parámetro fuera de rango/dominio | "Revisa los datos del formulario." |
| `401` | Sin sesión, sesión expirada, cuenta inhabilitada o dada de baja — **indistinguibles a propósito** (R13/R15) | "Tu sesión terminó. Inicia sesión de nuevo." (nunca "tu cuenta está inhabilitada": el servidor no lo dice y el cliente no debe adivinarlo) |
| `403` | Sin permiso: rol insuficiente, recurso ajeno, auto-decisión, auto-cambio de rol | "No tienes permiso para esta acción." |
| `404` | No existe **o** no es visible para el catálogo (R4) | "Este anuncio ya no está disponible." Idéntico en ambos casos |
| `409` | Duplicado: email activo, nombre de categoría | "Ya existe un registro con esos datos." |
| `422` | Regla de negocio violada (editar contenido reinicia revisión, visibilidad sobre no aprobado, auto-conversación, mensaje vacío…) | Se muestra el `detail` del servidor (ya viene en español y describe la regla); si falta, mensaje genérico |
| `429` | Límite de tasa (login/registro/reset/reenvío) | "Demasiados intentos seguidos. Espera un minuto e inténtalo de nuevo." **Sin cuenta atrás**: el contrato no envía `Retry-After` |
| `5xx` | Fallo del servidor | "Algo falló de nuestro lado. Vuelve a intentarlo." + `X-Request-Id` visible |

Reglas transversales:

- **Render seguro**: `title` y `detail` se insertan como texto. Prohibido `dangerouslySetInnerHTML` (obligación `prd.md:101`) y `WebView` para mostrar errores.
- **Un solo mapper**: la tabla vive en `core` y es la única fuente de mensajes de error; ninguna pantalla compone su propio mensaje por estado.
- **Errores de validación del formulario** vienen en `detail` como texto, no como mapa campo→mensaje: la interfaz asocia el error al formulario completo salvo que la validación espejo (§3.3) ya haya detectado el campo.
- **`403` y `404` no expulsan a login**: no son fallos de sesión.

### 3.3 Validación espejo

Obligación del PRD: validar en el cliente lo que el contrato declara, sin inventar reglas. Se implementa una vez en `core/validacion` y la usan ambas apps:

| Regla | Origen |
|---|---|
| `contrasena` mínimo 8, sin reglas de composición | `docs/prd.md:80` |
| `nombre` y `email` obligatorios; `email` sintácticamente válido y único entre cuentas activas | `openapi.yaml:1269-1283` |
| Precio entre `0` y `99999999.99` | `docs/prd.md:77` |
| 1..5 imágenes de 5 MB; avatar de 2 MB; `jpeg/png/gif/webp` | `application.yml:65-78` |
| Mensaje no vacío tras recortar espacios | `docs/prd.md:79` |
| Motivo obligatorio al rechazar o retraer | `docs/prd.md:74` |

La validación del cliente **mejora la experiencia**; la autoridad es el servidor. Un `422` del servidor nunca se oculta ni se convierte en "no debería pasar".

---

## 4. Paginación

| Modo | Endpoints | Parámetros | Respuesta |
|---|---|---|---|
| **Cursor** | `GET /anuncios`, `GET /conversaciones/{id}/mensajes` | `cursor` (opaco, ausente = primera página), `limite` | `paginacion.cursorSiguiente`; `null` = última página |
| **Offset** | `mis-anuncios`, `mis-conversaciones`, moderación, admin | `pagina` (base 0), `limite` (20 por defecto, máx. 100) | `pagina`, `limite`, `total`, `totalPaginas` |

Detalles que la interfaz debe respetar:

1. **El catálogo no usa `pagina`**: usar offset contra un endpoint de cursor es un error de contrato. En el catálogo, "página siguiente" **es** el cursor.
2. **Historial de mensajes hacia atrás**: la primera página son los mensajes **más recientes**; cargar más trae los anteriores y se insertan **al principio**, conservando la posición de lectura (si no, el hilo salta).
3. **Cursor opaco**: se devuelve tal cual. Prohibido construir, interpretar, parsear o modificar su valor.
4. **Sin solapamiento**: al fusionar páginas, la clave de identidad es el `id` del elemento; se descartan duplicados por si el servidor repite uno en la frontera.
5. **`limite` máximo 100**: pedir más es `400`. La interfaz no expone un control para pedir más de lo permitido.
6. **Offset**: `totalPaginas` puede ser `0` con lista vacía; "página 1 de 0" es un estado vacío, no un error.

Adaptadores únicos en `core/paginacion` (`usarListaCursor`, `usarListaPaginada`), consumidos por ambas apps. Ninguna pantalla implementa su propio bucle de paginación.

---

## 5. Medios

| Entorno | Forma de la URL | Ejemplo |
|---|---|---|
| Dev (`filesystem`) | **Relativa** | `/media/anuncios/{vendedorId}/{uuid}.jpg` |
| Prod (`r2`) | **Absoluta** | `https://pub-....r2.dev/anuncios/{vendedorId}/{uuid}.jpg` |

Regla única (`core/medios`):

```js
resolverUrlMedia(valor, origenApi)
// 'https://...' → se usa tal cual
// '/media/...'  → origenApi + valor   (origenApi = base sin el sufijo /v1)
// otro          → origenApi + '/' + valor
```

Notas:

- El cliente **nunca** construye rutas de medios a mano ni guarda la URL: guarda el valor que devuelve la API y lo resuelve al renderizar.
- Las claves incluyen un UUID: el contenido es inmutable → caché larga y sin parámetros anti-caché.
- Las imágenes públicas no requieren cabecera de autorización; los objetos de un anuncio eliminado no se borran (el anuncio desaparece del catálogo por su estado).
- `GET /media/**` es público (`ConfiguracionSeguridad.java:120`).

---

## 6. Subidas

| Operación | Endpoint | Formato | Límites |
|---|---|---|---|
| Crear anuncio | `POST /anuncios` | `multipart/form-data`: `nombre`, `precio`, `descripcion?`, `categoriaId?`, partes repetidas `imagenes` | 1..5 imágenes, 5 MB cada una |
| Reemplazar imágenes | `PUT /anuncios/{id}/imagenes` | multipart (reemplaza el conjunto completo) | Igual |
| Avatar | `PUT /usuarios/me/avatar` | multipart con parte `archivo` | 2 MB, `jpeg/png/gif/webp` |

Reglas:

1. **No se establece `Content-Type` a mano**: la plataforma debe fijarlo con su `boundary`. Hacerlo rompe la petición.
2. **Móvil**: `FormData` con el objeto `{ uri, name, type }`; **Web**: `FormData` con `File`/`Blob` del `input`.
3. **Validez real del tipo**: el servidor decide por *magic bytes*, no por el tipo declarado → renombrar un `.exe` a `.jpg` falla con `422`. El cliente avisa por extensión y tamaño (rápido y barato), pero **nunca** promete que una imagen es válida; si el servidor la rechaza, el mensaje de `422` se muestra tal cual.
4. **Validación previa** de cantidad y tamaño antes de subir, para no gastar una subida de 5 MB destinada a fallar.
5. **Progreso**: subir anuncios es la operación más lenta de la aplicación. La interfaz debe mostrar progreso o, como mínimo, un estado bloqueante honesto con opción de reintentar sin perder los datos del formulario.
6. **Edición que reinicia revisión (R6)**: guardar contenido de un anuncio `aprobado` o `rechazado` lo devuelve a `pendiente` y borra el rastro de rechazo. La interfaz **advierte antes**, con un diálogo de confirmación explícito.
7. **`Location` relativo**: la creación responde `201` con `Location: /v1/anuncios/{id}` (único header expuesto por CORS, `ConfiguracionSeguridad.java:79-80`). El `id` también va en el cuerpo; la interfaz usa el cuerpo y no depende de ese header.

---

## 7. Entornos y configuración

| Ajuste | Web | Móvil |
|---|---|---|
| Variable | `VITE_API_BASE_URL` | `EXPO_PUBLIC_API_BASE_URL` |
| Valor dev | `http://localhost:8080/v1` | Igual para emulador iOS/simulador; **`http://10.0.2.2:8080/v1`** en emulador Android; **IP de LAN** (`http://192.168.x.x:8080/v1`) en dispositivo físico |
| Origen de medios | Se deriva quitando `/v1` de la base | Igual |
| Persistencia del refresh | `localStorage` | Almacén seguro del sistema (Expo) |

Consideraciones de entorno:

- **CORS** (web): en dev la API permite `http://localhost:*` y `http://127.0.0.1:*`. En producción el valor por defecto es **vacío**: el origen del sitio debe declararse en el servidor (`CORS_ORIGENES`) o el navegador bloqueará todo. Es un requisito de despliegue, no un bug del frontend (riesgo R-2).
- **Móvil**: no hay CORS; sí hay que apuntar a una IP alcanzable desde el dispositivo.
- La configuración se lee en un único módulo por app (`config.js`) y se valida al arrancar: si falta la base, se falla temprano con un mensaje claro en vez de con peticiones contra `undefined`.

---

## 8. Deriva conocida del contrato (Q-DRIFT)

Verificado en la generación del cliente: los modelos solo conservan los campos **declarados** en el `openapi.yaml`.

Consecuencia: el endpoint de catálogo declara `datos: [AnuncioResumen]` (sin `estado` ni `fechaActualizacion`) mientras el runtime devuelve esos campos; el cliente generado **los descartará**.

Acción: la interfaz del catálogo **no debe depender** de esos campos (la visibilidad ya está garantizada por el propio filtro del endpoint). La corrección correcta es alinear el esquema en el repositorio de la API; parchear el cliente generado está prohibido (§1.4). El catálogo propio (`mis-anuncios`, `AnuncioPanel`) sí declara `estadoRevision` y `motivoRechazo` en el contrato y se usa sin reservas.

---

## 9. Checklist antes de usar un endpoint nuevo

- [ ] La operación existe en el contrato y el cliente regenerado la expone (nada de `fetch` a mano).
- [ ] Se sabe si es pública, autenticada, de moderador o de admin, y qué se muestra si el rol no alcanza.
- [ ] Se conoce su modo de paginación (cursor, offset o ninguno) y usa el adaptador correspondiente.
- [ ] Sus errores entran por la tabla de §3.2 sin mensajes inventados.
- [ ] Si devuelve imágenes, pasan por el resolver de §5.
- [ ] Si sube archivos, respeta §6 (sin `Content-Type` manual, validación previa, progreso).
- [ ] Su capacidad está en el mapa de capacidades por rol cuando corresponde.
