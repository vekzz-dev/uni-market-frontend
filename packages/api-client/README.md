# @uni-market/api-client

Cliente HTTP de Uni Market: **generado desde `openapi/uni-market.yaml`** y con un **transporte propio sobre `fetch`**.

| Campo | Valor |
|---|---|
| Fuente | `openapi/uni-market.yaml` (vendorizado, con lock de origen) |
| Generador | `openapi-generator-cli` 7.26.0 · generador `javascript` |
| Transporte | `src/generado/ApiClient.js` — propio, **no** lo escribe el generador |
| Pruebas | `node --test` (fetch falso, sin red) |

## Uso

```js
import { crearCliente } from '@uni-market/api-client';

const { catalogo, auth } = crearCliente({
  baseUrl: 'http://localhost:8080/v1',
  getAccessToken: () => sesion.accessToken, // en memoria, nunca persistido
});

const pagina = await catalogo.buscarCatalogo({ limite: 20 });
```

## Reglas

1. **No se escribe el cliente a mano.** El código de `src/generado/api` y `src/generado/model` solo lo produce `pnpm api:generate`; CI falla si deriva del contrato.
2. **El transporte es la única pieza manual.** `src/generado/ApiClient.js` implementa la superficie que consumen los módulos generados (`callApi`, `buildCollectionParam`, `convertToType`, …) sobre `fetch`, sin `superagent`.
3. **Los errores son `ApiError`** con `status`, `problem` (RFC 9457) y `requestId`; `normalizarProblema()` los deja en la forma que consume `core/errores`.
4. **Multipart sin `Content-Type` manual**: lo fija la plataforma con su boundary.
5. **Versión del generador fijada**: `openapitools.json` (raíz) pincha el jar en `7.26.0`, así que regenerar no depende de qué versión publique el CLI ese día.

## Comandos

```bash
pnpm api:generate   # regenera desde el contrato (requiere Java)
pnpm api:check      # regenera y falla si hay deriva
pnpm --filter @uni-market/api-client test
```
