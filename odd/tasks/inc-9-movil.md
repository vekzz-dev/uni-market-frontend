# Inc 9 — Paridad móvil y endurecimiento

**Objetivo**: llevar a Expo los flujos de Inc 4–8 con paridad de comportamiento, y cerrar la deuda de documentación y e2e.
**Rama**: `feat/inc-9-movil` · **Runner**: `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm --filter @uni-market/mobile export:web`.

## Specs

- **S1 — Vendedor**: publicar con imágenes (selector nativo, 1–5, validación espejo), panel con estado de revisión y acciones, y edición con relectura por id.
- **S2 — Mensajería**: lista con último mensaje y no leídos; hilo con cursor hacia atrás, envío y `POST /lecturas` explícito.
- **S3 — Perfil**: datos, avatar, contraseña y baja con confirmación.
- **S4 — Moderación**: cola FIFO con filtros y decisión motivada; acceso por capacidad.
- **S5 — Administración**: usuarios (búsqueda, rol, habilitación) y categorías (CRUD); acceso por capacidad.
- **S6 — Endurecimiento** (issue #47): README al día y e2e de mensajería y perfil reproducible.

## Tareas

- [x] **T1 — Vendedor**: publicar, mis anuncios y editar en Expo.
- [x] **T2 — Mensajería**: lista e hilo.
- [x] **T3 — Perfil**: datos, avatar, contraseña y baja.
- [x] **T4 — Moderación**: cola y decisión.
- [ ] **T5 — Administración**: usuarios y categorías.
- [ ] **T6 — Diseño móvil de administración** (única página sin frames móviles).
- [ ] **T7 — Endurecimiento**: README y e2e (issue #47).

## Log

- **L1 (2026-11-10, verbatim)**: "si dale arranca"
- **Nota**: el incremento se entrega por flujo, un commit por pantalla, para que la revisión no dependa de un bloque de miles de líneas.
- **Vendedor: publicar (2026-11-10)**: `expo-image-picker` añadido; `/publicar` en Expo con selector nativo (1–5 imágenes), validación espejo, categorías en chips, envío multipart por el cliente generado y estados de éxito/error. La cabecera del catálogo gana "Vender" con sesión. El proveedor móvil publica `restaurado`, como el web, para no expulsar al entrar con un refresh válido. `Campo` expone `accessibilityLabel` (beneficia a todos los formularios). 7 pruebas en móvil (10 en total). Faltan mis anuncios y editar de T1.
- **Vendedor: panel y edición (2026-11-10)**: `/mis-anuncios` con offset, badges (incluido retraído), motivo, acciones de visibilidad/vendido/baja con confirmación en línea y relectura al enfocar; `/mis-anuncios/[id]/editar` relee por id, precarga y hace PATCH de contenido. La cabecera del catálogo enlaza al panel. 6 pruebas nuevas (16 en móvil). El `useRouter` del mock debe ser estable: Expo lo memoiza y el efecto de carga depende de él.
- **Mensajería móvil (2026-11-10)**: `/mensajes` con offset, último mensaje, contraparte y badge de no leídos; `/mensajes/[id]` con cursor hacia atrás, burbujas propias/ajenas, envío con validación espejo y `POST /lecturas` una sola vez si había no leídos. Ambos releen al enfocar. El catálogo gana accesos rápidos (Vender, Mis anuncios, Mensajes) fuera de la cabecera, que se saturaba. 6 pruebas nuevas (22 en móvil).
- **Perfil móvil (2026-11-10)**: `/perfil` con datos, avatar (elegir con el selector nativo, validación espejo, eliminar), contraseña con validación y baja con confirmación en línea más cierre de sesión. La cabecera del catálogo reemplaza "Salir" por el avatar con iniciales que lleva al perfil; "Salir" vive ahora en el perfil. 4 pruebas nuevas (26 en móvil).
- **Moderación móvil (2026-11-10)**: `/moderacion` con filtros, paginación, aprobación en un toque y rechazo/retracción con motivo validado en línea; desenlace sin capacidad. El acceso vive en Perfil, como indica el diseño móvil (moderación y administración dentro de Perfil, solo con la capacidad). 3 pruebas nuevas (29 en móvil).
