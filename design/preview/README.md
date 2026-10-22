# Exportes de verificación — `design/preview/`

Una imagen por vista, **frame por frame** (no la página completa). Son artefactos **derivados**: la fuente de verdad es `design/uni-market.fig`.

## Por qué PNG

- **La tipografía es la correcta.** El export de SVG referencia `Inter` pero **no incrusta la fuente**: cualquier visor sin Inter instalada sustituye la tipografía y la revisión deja de ser fiel. El PNG se rasteriza dentro de la app, con su fuente.
- **Se abre en cualquier sitio** — explorador de archivos, chat, issues, presentación — sin depender de fuentes ni de soporte SVG.
- **Frame por frame**: cada imagen es una vista, no un tablero de 6 frames que hay que recortar mentalmente.

Si algún día hace falta un artefacto **diffable** en git, el CLI puede exportar SVG con `-f svg`; el texto queda como `<text>` y el diff funciona. Se descartó como formato primario por la sustitución de fuente.

## Estructura

Cada carpeta corresponde a una **página del `.fig`**; dentro, un PNG por frame.

| Carpeta | Frames | Escala |
|---|---|---|
| `cover.png` | Portada, suelta en la raíz (es la entrada) | 1× |
| `00-fundamentos/` | fundamentos | 1× |
| `01-catalogo/` | web, vacío, error (ambas plataformas) | 1× web / 2× móvil |
| `02-entrar/` | default, credenciales, límite | 1× web / 2× móvil |
| `03-registro/` | default, conflicto, enviado | 1× web / 2× móvil |
| `04-confirmar/` | verificando, confirmado, inválido | 1× web / 2× móvil |
| `05-restablecer/` | default, enviado, límite | 1× web / 2× móvil |
| `06-nueva-contrasena/` | default, inválido, listo | 1× web / 2× móvil |
| `07-reenviar/` | default, enviado, límite | 1× web / 2× móvil |
| `08-detalle/` | default, no disponible, error | 1× web / 2× móvil |

Convención de nombre: **`<vista>-<plataforma>[-<estado>].png`** — `entrar-web.png`, `entrar-movil-credenciales.png`. El estado se omite cuando es el default.

Escala 1× en web (coincide con el diseño) y **2× en móvil**, porque 390 px de ancho se ven pequeños en pantalla.

## Regenerar

Con el documento guardado:

```bash
openpencil export design/uni-market.fig -f png -s 1 --node <id> -o design/preview/<carpeta>/<nombre>.png
```

Tres cosas que cuestan tiempo si no se saben:

1. **`--page` y `--node` son excluyentes**: el CLI falla con `--page and --node cannot be used together`.
2. **Los IDs del archivo son globales**, no por página. Los que muestra `tree --page …` son locales a la página y no sirven para `--node`. Para el ID global: `openpencil find design/uni-market.fig --name "<nombre>" --json` (busca en todas las páginas).
3. **El export por MCP (`export_image`) ignora `id`/`node`** y saca la página completa: para una vista suelta hay que usar el CLI.

## Limitación conocida

El diseño y el producto usan **Inter**: los PNG rasterizan la misma tipografía que servirá la app (autoalojada, `font-display: swap`). Ya no hay divergencia — **Q-FONT** se resolvió el 2026-10-20.
