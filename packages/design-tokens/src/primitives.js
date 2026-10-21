// Nivel 1 — primitivos: escalas crudas de la identidad "Ember".
// Ninguna app consume este nivel directamente: solo alimenta al nivel semántico.
// Los colores están verificados contra WCAG 2.2 AA en test/contraste.test.mjs.

// Grises neutros (misma familia, sin tonos improvisados).
export const gray = {
  white: '#FFFFFF',
  nearWhite: '#F9FAFB', // fondo general
  light: '#F3F4F6', // hover neutro
  border: '#E5E7EB', // borde decorativo
  borderStrong: '#D1D5DB', // borde decorativo enfatizado
  borderField: '#7C8595', // CORREGIDO: borde de campo — 3.38:1 en el peor caso (sobre hover)
  borderFieldDark: '#8B93A0', // borde de campo en tema oscuro (4.11:1 en el peor caso)
  medium: '#6B7280', // texto deshabilitado (exento de AA; piso de legibilidad 3:1)
  secondary: '#4B5563', // CORREGIDO: texto secundario (antes #6B7280 = 4.39:1 sobre hover)
  strong: '#374151', // borde decorativo en oscuro
  darker: '#2A3341', // superficie hover en oscuro (medido: 5.02:1 con el secundario)
  dark: '#1F2937', // superficie en oscuro
  darker_900: '#111827', // texto principal (claro) y fondo (oscuro)
};

// Naranja de marca y sus pasos.
export const orange = {
  softest: '#FFF7ED',
  soft: '#FFEDD5',
  light: '#FDBA74',
  strong: '#FB923C', // acento en oscuro
  base: '#F97316', // marca
  hover: '#EA580C', // SOLO iconos/bordes: no admite ningún texto en AA (3.56:1 con blanco, 4.40:1 con oscuro)
  active: '#C2410C', // CORREGIDO: hover del botón primario y enlaces (5.18:1 con blanco)
  darker: '#9A3412', // activo y enlaces en hover (7.31:1 con blanco)
  darkest: '#7C2D12',
  ink: '#431407', // texto sobre relleno naranja (5.58:1 sobre #F97316)
  deepBg: '#3A1512', // fondos suaves de estado en oscuro
};

export const green = { base: '#16A34A', soft: '#F0FDF4', text: '#166534', dark: '#4ADE80', darkSoft: '#0F2A1A' };
export const amber = { base: '#D97706', soft: '#FFFBEB', text: '#92400E', dark: '#FBBF24', darkSoft: '#33240A' };
export const red = { base: '#DC2626', soft: '#FEF2F2', text: '#991B1B', dark: '#FCA5A5', darkSoft: '#3A1512' };
export const blue = { base: '#2563EB', soft: '#EFF6FF', text: '#1D4ED8', dark: '#93C5FD', darkSoft: '#10233F' };

// Escalas no cromáticas.
export const space = { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px', 8: '64px' };
export const radius = { control: '8px', card: '12px', pill: '999px' };
export const duration = { fast: '120ms', base: '200ms' };

// Tipografía: Inter autoalojada (decisión Q-FONT, 2026-10-20), con la pila del
// sistema como respaldo. El .woff2 lo sirve cada app desde su propio dominio
// (Inc 0/1) con font-display: swap; no se usa ningún CDN de fuentes.
export const fontFamily =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const fontSize = { xs: '12px', sm: '14px', base: '16px', lg: '20px', xl: '24px', '2xl': '30px' };
export const lineHeight = { xs: '1.4', sm: '1.45', base: '1.5', lg: '1.35', xl: '1.25', '2xl': '1.2' };
export const fontWeight = { regular: '400', medium: '500', semibold: '600' };

// Control y foco. El foco lleva desplazamiento obligatorio: sin él, el anillo
// queda pegado al relleno naranja del botón (1.85:1) y no es visible.
export const control = { minSize: '44px' };
export const focus = { width: '3px', offset: '2px' };

export const shadow = { elevated: '0 8px 24px rgba(17, 24, 39, 0.12)' };
