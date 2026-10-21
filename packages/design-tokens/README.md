# @uni-market/design-tokens

Identidad visual de Uni Market: **Ember** (naranja de acción sobre neutros cálidos), con claro y oscuro, como fuente única de tokens para web y móvil.

| Campo | Valor |
|---|---|
| Identidad | Ember — adoptada con correcciones de accesibilidad medidas |
| Temas | `light` (predeterminado) y `dark` (derivado de la misma familia cromática) |
| Verificación | `node --test` — contraste WCAG 2.2 AA de cada par + estructura + deriva |
| Consumo web | `build/tokens.css` → variables CSS `--um-*` |
| Consumo móvil | `themeFor('dark')` → objetos JS para `StyleSheet.create` |

## Uso

```js
// Móvil (React Native / Expo)
import { themeFor } from '@uni-market/design-tokens';

const { semantic, components } = themeFor('dark');
const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: semantic.surface, borderColor: semantic.border },
  precio: { color: semantic.text },
});
```

```css
/* Web: una sola importación en el punto de entrada */
@import '@uni-market/design-tokens/css';

.tarjeta {
  background: var(--um-surface);
  border: 1px solid var(--um-border);
}
```

El archivo CSS incluye: `:root` con el tema claro, oscuro automático por `prefers-color-scheme` (salvo que la app fije `data-um-theme="light"`), oscuro forzado con `[data-um-theme="dark"]` y la regla de foco visible.

## Estructura

```
src/primitives.js    escalas crudas (colores de la marca, espacio, tipografía, radio, duración)
src/semantic.js      roles de la interfaz por tema — el nivel que consumen las apps
src/components.js    combinaciones: botones, insignias de estado, campos, tarjeta, anillo de foco
src/index.js         themeFor(), themes
build.mjs            genera build/tokens.css (determinista)
build/tokens.css     GENERADO — no editar a mano
test/                contraste, estructura y deriva
```

## Correcciones aplicadas a la paleta original

Cada valor se midió antes y después (detalle: `../../docs/design-system.md` §2.3):

| Elemento | Antes | Ahora | Motivo |
|---|---|---|---|
| Texto secundario | `#6B7280` | `#4B5563` | 4.39:1 sobre el fondo de hover → 6.87:1 |
| Hover del botón primario | `#EA580C` | `#C2410C` | `#EA580C` no admite ningún texto en AA (blanco 3.56:1, oscuro 4.40:1) |
| Activo del botón primario | `#C2410C` | `#9A3412` | Sube de 5.18:1 a 7.31:1 con blanco |
| Borde de campo | `#D1D5DB` | `#8B93A0` | 1.47:1 → 3.10:1 (WCAG 1.4.11) |
| Indicador de foco | `#F97316` + halo `#FFEDD5` | `#C2410C` con `outline-offset: 2px` | El par original fallaba en sus dos partes (2.80:1 y 1.15:1); sin desplazamiento el anillo toca el relleno naranja a 1.85:1 |
| Insignias de estado | relleno sólido | par suave siempre | Blanco sobre `#16A34A` = 3.30:1 y sobre `#D97706` = 3.19:1 |
| Texto deshabilitado | `#6B7280` / `#9CA3AF` | `#5B6370` / `#AEB7C4` | 3.90:1 y 4.06:1 → **4.90:1 y 5.09:1**: el estado ya lo comunica el relleno gris, no un texto ilegible |

## Reglas que estos tokens hacen cumplir

1. **El naranja relleno es una sola acción por pantalla.** Es el 10% del 60-30-10 — y en el catálogo, menos: las fotos de los anuncios ya aportan el color.
2. **`pendiente` nunca se rellena de ámbar.** La marca (`#F97316`) y la advertencia (`#D97706`) están a 1.14:1: una insignia ámbar rellena junto a un botón naranja no se distingue. Se usa el par suave.
3. **Éxito y advertencia no se rellenan en sólido.** Sus tokens de texto sobre relleno no existen a propósito: la ausencia es la regla.
4. **Los estados se dicen con palabras**, nunca solo con color (`design-system.md` §1).
5. **El foco siempre visible y siempre con desplazamiento.**
6. **En oscuro el naranja se aclara**, no se oscurece: `#F97316` sobre `#111827` da 6.33:1 y sirve como texto, pero pierde fuerza como superficie frente a `#FB923C`.

## Comandos

```bash
node build.mjs      # regenera build/tokens.css
node --test         # contraste + estructura + deriva
```
