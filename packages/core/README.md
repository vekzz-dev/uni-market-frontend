# @uni-market/core

Dominio compartido por web y móvil. **No importa React ni React Native**: se ejecuta en Node y por eso sus pruebas no necesitan navegador ni simulador.

| Módulo | Qué resuelve |
|---|---|
| `sesion/gestorSesion.js` | Máquina de estados (`anonimo`/`autenticado`/`expirado`), refresh de **vuelo único**, refresco proactivo antes de expirar, `401` → refresh → **un** reintento, restauración al arrancar y adopción de pares renovados por otra pestaña |
| `errores/mapearProblema.js` | Tabla de copy por estado HTTP (`docs/api-integration.md` §3.2), sin inventar causas |
| `formato/formato.js` | Precio en USD (`$45.00`), fecha legible y fecha relativa con reloj inyectable |
| `medios/resolverUrlMedia.js` | Dev relativo (`/media/...`) y prod absoluto (R2) con una sola regla |

## Uso de la sesión

```js
import { crearGestorSesion } from '@uni-market/core';

const sesion = crearGestorSesion({
  auth,                                    // objeto de @uni-market/api-client
  almacen: {
    leer: () => localStorage.getItem('refresh'),
    escribir: (v) => localStorage.setItem('refresh', v),
    borrar: () => localStorage.removeItem('refresh'),
  },
});

await sesion.restaurar();                  // al arrancar
await sesion.iniciarSesion({ email, contrasena });
const perfil = await sesion.ejecutar(() => usuarios.leerPerfilPropio());
```

## Reglas

1. **El access token nunca sale de la memoria.** `obtenerEstado()` no lo incluye; el cliente lo lee con `obtenerAccessToken()`.
2. **El refresh se persiste con el almacén inyectado** (localStorage en web, almacén seguro en móvil). Core no toca APIs de plataforma.
3. **Un segundo `401` no se reintenta**: la sesión pasa a `expirado` y se limpia el almacén.
4. **El reloj se inyecta** en las pruebas; ninguna prueba lee la fecha del sistema.

## Pendiente en este paquete

Paginación (cursor/offset), validación espejo y capacidades por rol — llegan en el siguiente slice.

## Comandos

```bash
pnpm --filter @uni-market/core test
```
