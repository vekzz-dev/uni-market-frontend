# Sistema de diseño — Uni Market (web + móvil)

Vocabulario visual y de interacción compartido por `apps/web` y `apps/mobile`. La identidad visual está **adoptada** (Ember) y sus valores están verificados por pruebas ejecutables, no por criterio estético.

| Campo | Valor |
|---|---|
| Estado | Adoptado — identidad **Ember** con correcciones de accesibilidad medidas |
| Fuente de tokens | `packages/design-tokens` (implementado; una sola fuente para ambas apps) |
| Verificación | `node --test` en `packages/design-tokens` → 23 pruebas (contraste, estructura, deriva) |
| Obligación de origen | WCAG 2.2 AA, temas claro/oscuro, interfaz en español — `uni-market-api/docs/prd.md:101` |
| Relacionado | [`frontend-design.md`](frontend-design.md) §8 (dirección visual) · [`testing-strategy.md`](testing-strategy.md) |

---

## 1. Principios de interfaz

1. **El contenido manda.** La foto y el precio de un anuncio son el contenido; el cromo de la interfaz nunca compite con ellos.
2. **Densidad útil, no aire decorativo.** El catálogo existe para comparar, no para deslumbrar.
3. **El estado siempre se dice con palabras.** Color + texto + (cuando aplica) icono. Nunca solo color: es requisito de accesibilidad y también de claridad.
4. **Una sola fuente de valores.** Si un color, radio o espacio aparece en dos sitios, uno es un token mal usado.
5. **Los estados vacíos y de error se diseñan, no se improvisan.** Ver §6.
6. **Sin decoración sin función.** Nada de gradientes decorativos, glassmorphism, blobs, sombras que no comuniquen elevación ni emojis usados como iconos de interfaz (los emojis son **dato** de categoría y vienen del servidor).

---

## 2. Tokens: una fuente, dos consumidores

`packages/design-tokens` (identidad **Ember**) exporta un objeto JavaScript de tres niveles (`primitivo → semántico → componente`). Las apps **nunca** usan un valor crudo: consumen el nivel semántico.

```
packages/design-tokens/
├─ src/primitives.js   escalas crudas (colores de la marca, espacio, tipografía, radio, duración)
├─ src/semantic.js     roles de la interfaz, por tema — el nivel que consumen las apps
├─ src/components.js   combinaciones: botones, insignias de estado, campos, tarjeta, anillo de foco
├─ src/index.js        themeFor(modo), themes
├─ build.mjs           genera build/tokens.css (determinista)
├─ build/tokens.css    GENERADO — no editar a mano
└─ test/               contraste (WCAG AA) + estructura + deriva
```

| Consumidor | Forma de uso |
|---|---|
| Web | `@import '@uni-market/design-tokens/css'` una vez en el punto de entrada; los CSS Modules consumen `var(--um-...)` |
| Móvil | `import { themeFor } from '@uni-market/design-tokens'` y los roles dentro de `StyleSheet.create` |

**Por qué esta forma**: el pedido es CSS puro para web y React Native no tiene CSS. Generar las variables CSS desde el mismo objeto evita el escenario clásico de dos productos con colores distintos según la plataforma. El generador es determinista y una prueba falla si `tokens.css` deriva del código fuente.

### 2.1 Roles semánticos (adoptados y verificados)

| Rol | Uso | Claro | Oscuro |
|---|---|---|---|
| `primary` | Acción principal (**relleno**) | `#F97316` | `#FB923C` |
| `primaryHover` / `primaryActive` | Estados del relleno primario | `#C2410C` / `#9A3412` | `#FDBA74` / `#F97316` |
| `primaryStrong` | Naranja oscuro para texto y enlaces | `#9A3412` | `#FDBA74` |
| `primarySoft` / `primarySelected` | Fondos destacados y seleccionados | `#FFF7ED` / `#FFEDD5` | `#431407` |
| `bg` / `surface` / `surfaceHover` | Fondo, tarjetas, hover neutro | `#F9FAFB` / `#FFFFFF` / `#F3F4F6` | `#111827` / `#1F2937` / `#2A3341` |
| `text` / `textSecondary` / `textInverse` | Texto principal, secundario, sobre relleno oscuro | `#111827` / `#4B5563` / `#FFFFFF` | `#F9FAFB` / `#9CA3AF` / `#111827` |
| `link` / `linkHover` | Enlaces y énfasis | `#C2410C` / `#9A3412` | `#FB923C` / `#FDBA74` |
| `border` / `borderStrong` | Separadores y contornos (decorativos) | `#E5E7EB` / `#D1D5DB` | `#374151` / `#4B5563` |
| `borderField` | Borde que **identifica** un control | `#7C8595` | `#8B93A0` |
| `focus` | Indicador de foco (con desplazamiento) | `#C2410C` | `#FDBA74` |
| `success` / `warning` / `error` / `info` | Estado sólido | `#16A34A` / `#D97706` / `#DC2626` / `#2563EB` | `#4ADE80` / `#FBBF24` / `#FCA5A5` / `#93C5FD` |
| `*Soft` + `*Text` | Par suave de cada estado (el que se usa en insignias) | `#F0FDF4`+`#166534` · `#FFFBEB`+`#92400E` · `#FEF2F2`+`#991B1B` · `#EFF6FF`+`#1D4ED8` | `#0F2A1A`+`#4ADE80` · `#33240A`+`#FBBF24` · `#3A1512`+`#FCA5A5` · `#10233F`+`#93C5FD` |
| `disabledBg` / `disabledText` | Deshabilitado (legible: ≥ 4.5:1) | `#E5E7EB` / `#5B6370` | `#374151` / `#AEB7C4` |

Los estados de revisión se resuelven con el nivel de componente, no a mano: `badge.pending` = par de advertencia, `badge.approved` = par de éxito, `badge.rejected` = par de error (siempre acompañado del motivo), `badge.sold` = superficie hover + texto secundario. Los tres estados y `vendido` se comunican siempre con **texto**: nada se comunica solo por color.

### 2.2 Escalas

| Escala | Valores |
|---|---|
| Espacio | `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (base 4) |
| Radio | `control 8px · tarjeta 12px · píldora 999px` |
| Tipografía | **Inter autoalojada** (woff2 propio, `font-display: swap`) con la pila del sistema como respaldo (`system-ui, -apple-system, Segoe UI, Roboto…`), 6 tamaños con altura de línea explícita y 3 pesos. Sin CDN de fuentes: privacidad y un solo origen. El archivo de diseño ya coincide — **Q-FONT** resuelta (`frontend-design.md` §10) |
| Sombra | Una sola (`elevada`) para hojas y modales; las tarjetas usan borde |
| Duración | `120ms` micro · `200ms` transición |
| Objetivo táctil | `44px` mínimo (web y móvil) |
| Foco | `3px` sólido + `2px` de desplazamiento — **el desplazamiento es requisito** |

### 2.3 Reglas que la auditoría de contraste convirtió en invariantes

La identidad se adoptó con las correcciones que las mediciones exigieron (tabla completa antes/después en `packages/design-tokens/README.md`). De ahí salen reglas que no se pueden negociar caso por caso:

1. **El naranja de marca es color de relleno, no de texto.** `#F97316` sobre fondo claro da 2.80:1: no alcanza ni el 3:1 de componente. Texto, enlaces e iconos usan `link`/`primaryStrong` (5.18:1 y 7.31:1). En oscuro el acento se aclara y sí puede ser texto.
2. **En oscuro el naranja se aclara, no se oscurece.** `#F97316` sobre `#111827` da 6.33:1 y sirve como texto, pero pierde fuerza como superficie frente a `#FB923C`.
3. **El botón primario cambia de color de texto al cambiar de relleno**: tinta oscura `#431407` sobre el naranja base, blanco sobre los rellenos oscuros de hover y activo. `#EA580C` queda para iconos y bordes: no admite ningún texto en AA (blanco 3.56:1, oscuro 4.40:1).
4. **El indicador de foco va siempre con desplazamiento.** Sin él, el anillo toca el relleno naranja a 1.85:1 (claro) y 1.34:1 (oscuro) y deja de ser visible. El halo suave `#FFEDD5` ya no es indicador: 1.15:1.
5. **`pendiente` nunca se rellena de ámbar.** La marca (`#F97316`) y la advertencia (`#D97706`) están a 1.14:1: una insignia ámbar rellena junto a un botón naranja no se distingue. Se usa el par suave.
6. **Éxito y advertencia no se rellenan en sólido**: blanco sobre `#16A34A` = 3.30:1 y sobre `#D97706` = 3.19:1. La ausencia del token es la regla (una prueba la verifica).
7. **Los bordes decorativos están exentos; el borde de campo no.** `border`/`borderStrong` (1.24:1 y 1.47:1) separan sin identificar: correcto. `borderField` identifica un control y por eso pasa 3:1 **sobre las tres superficies**, no solo sobre blanco — el primer valor que probé (`#8B93A0`) daba 3.10 sobre blanco pero 2.81 sobre el hover, y lo detectó la propia suite.
8. **El texto deshabilitado también se lee.** La exención de 1.4.3 para componentes inactivos no se usa como excusa: el par deshabilitado está en **4.90:1** (claro) y **5.09:1** (oscuro). Lo que comunica el estado es el relleno gris y la ausencia de interacción, no un texto difícil de leer.

Todo esto es verificable con un comando: `node --test` dentro de `packages/design-tokens` (23 pruebas: contraste por par y por tema, estructura de los dos temas, deriva del CSS generado).

### 2.2 Escalas

| Escala | Valores (propuestos) |
|---|---|
| Espacio | `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (base 4) |
| Radio | `control 8 · tarjeta 12 · píldora 999` |
| Tipografía | Escala de 6 tamaños con altura de línea explícita; **una** familia para texto y **una** para cifras/precios si se necesita énfasis; jerarquía por peso y tamaño, nunca por mayúsculas sostenidas |
| Sombra | Solo dos: `elevada` (hojas, modales) y ninguna. Las tarjetas usan borde, no sombra |
| Duración | `120ms` micro, `200ms` transición; nada por encima salvo hojas modales |
| Objetivo táctil | Mínimo `44×44` en web y móvil (WCAG 2.2 AA, obligación `prd.md:101`) |

---

## 3. CSS puro en web: convenciones

- **CSS Modules por componente** (`Boton.module.css` junto a `Boton.jsx`). Aísla estilos sin añadir dependencias: Vite lo soporta de fábrica y sigue siendo CSS puro (archivos `.css`, sin sintaxis propia). Alternativa considerada: un único CSS global con BEM; se descarta porque el aislamiento entre features se degrada en cuanto el producto crece.
- **Sin valores literales repetidos**: color, espacio, radio y tipografía salen de `var(--um-*)`. Un literal en un CSS Module es un token mal usado, salvo casos de un solo uso justificados en revisión (`0`, `100%`, `1px` de borde).
- **Estados por selector, no por clase calculada**: `:hover`, `:focus-visible`, `:disabled`, `[aria-busy="true"]`. El foco **siempre visible** (`outline: 2px solid var(--um-acento)`) y nunca `outline: none` sin sustituto.
- **Temas claro/oscuro** con `color-scheme` + `@media (prefers-color-scheme: dark)` reasignando variables; opción de forzar tema con un atributo en el elemento raíz para poder probarlo sin cambiar el sistema operativo.
- **Movimiento reducido**: `@media (prefers-reduced-motion: reduce)` desactiva transiciones no esenciales.
- **Sin `!important`** salvo sobreescritura de terceros, con el motivo en un comentario.
- **Nombres de clase en inglés**, copy visible en español (D14).

---

## 4. Estilos en móvil

- `StyleSheet.create` con el objeto de tokens; nada de literales de color o espacio sueltos.
- La jerarquía visual se construye con **tamaño, peso y espaciado** (no con sombras, que en Android rinden distinto).
- Imágenes con `resizeMode` y relación de aspecto declarada para evitar saltos de layout al cargar; `expo-image` si se necesita caché y transición.
- Estados táctiles con `Pressable` y `accessibilityState={{ disabled, selected, busy }}`, nunca con un `View` que parece botón y no lo es.
- Tipografía: se respeta el escalado de texto del sistema; ninguna medida de texto en píxeles absolutos que ignore el ajuste del usuario.

---

## 5. Inventario de componentes

Comparten nombre y contrato visual, se implementan dos veces (web y móvil) porque el motor de render es distinto:

| Componente | Contrato |
|---|---|
| `Boton` | Variantes `primario`, `secundario`, `peligro`, `texto`; estados `cargando` (bloquea y anuncia), `deshabilitado`; nunca dos primarios juntos |
| `Campo` | Etiqueta siempre visible (nunca solo placeholder), texto de ayuda, error asociado por `aria-describedby`/`accessibilityHint` |
| `TarjetaAnuncio` | Imagen, precio, título, categoría, estado de revisión cuando es propio. La imagen tiene prioridad visual |
| `GaleriaImagenes` | Portada + miniaturas, navegación por teclado en web y deslizamiento en móvil |
| `SelectorEstado` | Filtro por categoría/orden (web: `select` nativo; móvil: hoja con lista) |
| `InsigniaEstado` | `pendiente` / `aprobado` / `rechazado` / `vendido` con texto obligatorio |
| `Aviso` | Mensaje informativo o de error, con acción opcional; variantes por rol semántico |
| `Esqueleto` | Carga de listas y tarjetas; sin animación si el usuario pidió movimiento reducido |
| `EstadoVacio` | Explica por qué no hay nada y ofrece la siguiente acción |
| `DialogoConfirmacion` | Acciones destructivas o que reinician revisión (R6) |
| `PaginadorInfinito` | Cursor: cargar más al llegar al final, con "cargar más" explícito como respaldo accesible |
| `ListaPaginada` | Offset: anterior/siguiente con `total` visible |
| `SubidorImagenes` | Selección múltiple, reordenar, quitar, validación previa de tamaño y cantidad |
| `CabeceraNavegacion` | Sesión (entrar/salir), enlace al catálogo, acceso a mensajes con conteo no leído |
| `IndicadorSesion` | Estado de sesión (anónimo, autenticado, expirado) y acción correspondiente |

Regla de reutilización: se comparte un componente cuando el **comportamiento** es el mismo; forzar el mismo componente para interacciones distintas (selector de escritorio y hoja móvil) produce peor resultado que dos componentes honestos.

---

## 6. Estados de pantalla (patrón único)

| Estado | Cómo se ve | Regla |
|---|---|---|
| Carga inicial | Esqueleto con la forma real del contenido | No se usa un spinner centrado a pantalla completa |
| Carga incremental | Indicador al final de la lista | Conserva lo ya cargado; nunca vacía la lista |
| Vacío | Título, motivo y acción | "Aún no has publicado anuncios" + botón publicar |
| Error de red | `Aviso` de error + botón reintentar | No se pierde el texto ya escrito en formularios |
| `403` | Aviso de permiso, sin navegación a login | Es un caso de negocio, no un fallo de sesión |
| `404` en catálogo | "Este anuncio ya no está disponible" | Idéntico para inexistente e invisible (R4) |
| Sesión expirada | Aviso + re-login, conservando el destino | Se dispara tras un `401` que sobrevivió al refresh |
| `429` | Aviso con copy fijo y envío deshabilitado | No hay cuenta atrás: no se inventa |
| Éxito | Confirmación breve y no bloqueante | Evitar modales de "operación exitosa" para acciones triviales |

---

## 7. Accesibilidad (base WCAG 2.2 AA)

Obligación de producto (`uni-market-api/docs/prd.md:101`, `:112`). Verificación declarada por requisito, no genérica:

| Criterio | Web | Móvil |
|---|---|---|
| Estructura semántica | HTML semántico, un `h1` por vista, orden de encabezados sin saltos, landmarks | `accessibilityRole` correcto en cada control |
| Teclado | Todo operable con teclado, foco visible, trampa de foco en diálogos, `Esc` cierra | — (no aplica) |
| Objetivo táctil | ≥ `44×44` px | ≥ `44×44` dp |
| Contraste | ≥ 4.5:1 texto normal, ≥ 3:1 texto grande y componentes | Mismo criterio |
| Verificación de contraste | **Automática** (todos los pares, ambos temas): `node --test` en `packages/design-tokens` | Mismo criterio |
| Estados no solo por color | Insignias y avisos con texto | Igual |
| Formularios | Etiqueta visible, error asociado al campo, `aria-invalid`, foco al primer error | `accessibilityLabel` + `accessibilityHint`, error anunciado |
| Operación sin ratón | Ninguna acción exclusiva de arrastre: subir/quitar imágenes tiene botones | Igual |
| Movimiento reducido | `prefers-reduced-motion` | Ajuste equivalente del sistema |
| Anuncios dinámicos | `aria-live="polite"` para resultados y errores de envío | `AccessibilityInfo.announceForAccessibility` |
| Texto alternativo | `alt` descriptivo en fotos de anuncio; decorativo vacío | `accessibilityLabel` en imágenes |

Los emojis de categoría que envía el servidor **no** son la etiqueta accesible: se acompañan del nombre de la categoría.

---

## 8. Composición y responsive

Reglas concretas, derivadas del contenido y no de un template:

| Contexto | Composición |
|---|---|
| Web ≥ 1024 px | Catálogo a **3 columnas**; contenedor 1440; padding 32; tarjeta vertical con foto 168 px, título a 2 líneas, precio 20 px |
| Web 640–1023 px | 2 columnas (regla definida, **aún no dibujada**) |
| Web < 640 px | 1 columna con la misma tarjeta horizontal del móvil; el header pasa a dos filas |
| App móvil | Lista de **1 columna con tarjeta horizontal** (foto 104 px + información a la derecha), header en dos filas (marca + avatar, búsqueda a ancho completo), chips con "+N" |

Principios de composición que no cambian por breakpoint:

1. **El precio nunca se trunca ni se reduce** para hacer caber un título. El título se recorta a 2 líneas (`maxLines`), el precio no.
2. **La foto manda**: en web es la mitad superior de la tarjeta; en móvil es el bloque izquierdo de altura fija (112 px).
3. **Una sola acción primaria por vista.** El catálogo tiene "Publicar anuncio" en el header; los estados vacío y error usan su propia acción y por eso no compiten.
4. **Organización del archivo de diseño**: una **página por vista**, con el frame **web a la izquierda** y el **móvil a la derecha**, y **cada columna con sus estados debajo**. Un estado que existe en web debe existir en móvil: la asimetría es exactamente cómo divergen los productos. Los estados no crean páginas nuevas. Un flujo con muchas vistas se reparte en una página por vista (`02 · Entrar`, `03 · Registro`, …), no en una página gigante.
5. **El móvil no es la web aplastada**: cambia la tarjeta (vertical → horizontal), el header (una → dos filas) y los chips (fila completa → "+N").
6. **Anchos de texto**: todo texto dentro de una columna usa `w="fill"`; sin eso el texto desborda y se recorta contra el borde de la tarjeta (defecto real detectado y corregido en la vista móvil).

## 9. Checklist antes de dar una pantalla por terminada

- [ ] Todos los estados de §6 resueltos, incluido `403`, `404` indistinguible y `429`.
- [ ] Cero literales de color/espacio/radio fuera de los tokens.
- [ ] Foco visible y recorrido por teclado comprobado (web).
- [ ] Textos en español; identificadores en inglés.
- [ ] Contraste comprobado en tema claro y oscuro.
- [ ] Insignias de estado con texto, no solo color.
- [ ] Sin animación cuando el usuario pidió movimiento reducido.
- [ ] Probada a 1440×900 y 390×844 (web) / pantalla pequeña y grande (móvil) con contenido largo y datos faltantes.
