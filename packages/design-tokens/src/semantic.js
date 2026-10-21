// Nivel 2 — semántico: roles de la interfaz. Es el nivel que consumen las apps.
// Los dos temas declaran EXACTAMENTE las mismas claves (lo verifica test/estructura.test.mjs).
// Cada valor está medido en test/contraste.test.mjs contra su umbral de WCAG 2.2 AA.
//
// Corregido respecto a la paleta original (auditoría del 2026-10-19):
//   - secondary:        #6B7280 (4.39:1 sobre hover) → #4B5563 (6.87:1)
//   - primaryHover:     #EA580C (no admite texto)    → #C2410C (5.18:1 con blanco)
//   - primaryActive:    #C2410C (5.18:1)             → #9A3412 (7.31:1 con blanco)
//   - borderField:      #D1D5DB (1.47:1)             → #8B93A0 (3.10:1)
//   - focus:            #F97316 (2.80:1)             → #C2410C (4.96:1 sobre fondo)
//   - `focus-ring` suave: eliminado como indicador (1.15:1); el halo suave
//     queda solo como decoración opcional, nunca como indicador de foco.

export const light = {
  // Marca
  primary: '#F97316',
  primaryHover: '#C2410C',
  primaryActive: '#9A3412',
  primaryStrong: '#9A3412',
  primarySoft: '#FFF7ED',
  primarySelected: '#FFEDD5',

  // Superficies
  bg: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceHover: '#F3F4F6',

  // Texto
  text: '#111827',
  textSecondary: '#4B5563',
  textInverse: '#FFFFFF',
  link: '#C2410C',
  linkHover: '#9A3412',

  // Bordes y foco
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  borderField: '#7C8595',
  focus: '#C2410C',

  // Estados
  success: '#16A34A',
  successSoft: '#F0FDF4',
  successText: '#166534',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  warningText: '#92400E',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  errorText: '#991B1B',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  infoText: '#1D4ED8',

  // Texto sobre relleno. Solo existen para los rellenos que lo admiten en AA:
  // error (4.83:1) e info (5.17:1). Éxito y advertencia NO se rellenan en
  // sólido: usan su par suave (6.81:1 y 6.84:1).
  // El botón primario cambia de color de texto al cambiar de relleno: el
  // naranja base lleva tinta oscura (#431407) y los rellenos oscuros de
  // hover/activo llevan blanco.
  textOnPrimary: '#431407',
  textOnPrimaryStrong: '#FFFFFF',
  textOnError: '#FFFFFF',
  textOnInfo: '#FFFFFF',

  // Deshabilitado: por encima de AA (4.90:1). El estado se comunica con el
  // relleno gris y la ausencia de interacción, no con texto ilegible.
  disabledBg: '#E5E7EB',
  disabledText: '#5B6370',
};

export const dark = {
  // Marca: en oscuro el naranja se ACLARA, no se oscurece.
  primary: '#FB923C',
  primaryHover: '#FDBA74',
  primaryActive: '#F97316',
  primaryStrong: '#FDBA74',
  primarySoft: '#431407',
  primarySelected: '#431407',

  // Superficies
  bg: '#111827',
  surface: '#1F2937',
  surfaceHover: '#2A3341',

  // Texto
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textInverse: '#111827',
  link: '#FB923C',
  linkHover: '#FDBA74',

  // Bordes y foco
  border: '#374151',
  borderStrong: '#4B5563',
  borderField: '#8B93A0',
  focus: '#FDBA74',

  // Estados (versión clara del tono: los oscuros desaparecen sobre fondo oscuro)
  success: '#4ADE80',
  successSoft: '#0F2A1A',
  successText: '#4ADE80',
  warning: '#FBBF24',
  warningSoft: '#33240A',
  warningText: '#FBBF24',
  error: '#FCA5A5',
  errorSoft: '#3A1512',
  errorText: '#FCA5A5',
  info: '#93C5FD',
  infoSoft: '#10233F',
  infoText: '#93C5FD',

  // Texto sobre relleno (recíproco de los pares suaves)
  textOnPrimary: '#431407',
  textOnPrimaryStrong: '#431407',
  textOnError: '#3A1512',
  textOnInfo: '#10233F',

  // Deshabilitado: por encima de AA (5.09:1).
  disabledBg: '#374151',
  disabledText: '#AEB7C4',
};

export const themes = { light, dark };
