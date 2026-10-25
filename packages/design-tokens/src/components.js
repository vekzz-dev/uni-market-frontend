// Nivel 3 — componentes: cómo se combinan los roles semánticos en piezas concretas.
// Aquí viven las reglas que no se pueden expresar con un solo token:
//   - el botón primario cambia de relleno Y de color de texto entre estados;
//   - las insignias de estado usan SIEMPRE el par suave (nunca relleno sólido),
//     porque la marca es naranja y el ámbar de "pendiente" queda a 1.14:1 de ella:
//     un relleno ámbar junto a un botón naranja no se distingue.
//   - el anillo de foco lleva desplazamiento obligatorio.

import { space, radius, control, focus, shadow } from "./primitives.js";

export const componentsFor = (theme) => ({
  button: {
    primary: {
      base: {
        bg: theme.primary,
        fg: theme.textOnPrimary,
        border: "transparent",
      },
      hover: {
        bg: theme.primaryHover,
        fg: theme.textOnPrimaryStrong,
        border: "transparent",
      },
      active: {
        bg: theme.primaryActive,
        fg: theme.textOnPrimaryStrong,
        border: "transparent",
      },
      disabled: {
        bg: theme.disabledBg,
        fg: theme.disabledText,
        border: "transparent",
      },
    },
    secondary: {
      base: { bg: theme.surface, fg: theme.text, border: theme.borderField },
      hover: {
        bg: theme.surfaceHover,
        fg: theme.text,
        border: theme.borderField,
      },
      active: { bg: theme.surfaceHover, fg: theme.text, border: theme.focus },
      disabled: {
        bg: theme.disabledBg,
        fg: theme.disabledText,
        border: "transparent",
      },
    },
    danger: {
      // Claro: relleno rojo con blanco (4.83:1). Oscuro: par suave, porque el
      // rojo claro relleno no admite texto claro en AA.
      base: { bg: theme.error, fg: theme.textOnError, border: "transparent" },
      hover: {
        bg: theme.errorText,
        fg: theme.textOnError,
        border: "transparent",
      },
      active: {
        bg: theme.errorText,
        fg: theme.textOnError,
        border: "transparent",
      },
      disabled: {
        bg: theme.disabledBg,
        fg: theme.disabledText,
        border: "transparent",
      },
    },
    text: {
      base: { bg: "transparent", fg: theme.link, border: "transparent" },
      hover: {
        bg: theme.primarySoft,
        fg: theme.linkHover,
        border: "transparent",
      },
      active: {
        bg: theme.primarySelected,
        fg: theme.linkHover,
        border: "transparent",
      },
      disabled: {
        bg: "transparent",
        fg: theme.disabledText,
        border: "transparent",
      },
    },
  },

  // Estados de un anuncio (R5/R6) y de la conversación.
  badge: {
    pending: { bg: theme.warningSoft, fg: theme.warningText }, // en revisión
    approved: { bg: theme.successSoft, fg: theme.successText }, // aprobado
    rejected: { bg: theme.errorSoft, fg: theme.errorText }, // rechazado (con motivo visible)
    sold: { bg: theme.surfaceHover, fg: theme.textSecondary }, // vendido
    info: { bg: theme.infoSoft, fg: theme.infoText }, // informativo
  },

  input: {
    bg: theme.surface,
    fg: theme.text,
    placeholder: theme.textSecondary,
    border: theme.borderField,
    borderFocus: theme.focus,
    borderError: theme.error,
    radius: radius.control,
  },

  card: {
    bg: theme.surface,
    border: theme.border,
    radius: radius.card,
    hoverBg: theme.surfaceHover,
    shadow: shadow.elevated,
  },

  // El desplazamiento no es decorativo: sin él el anillo tocaría el relleno
  // naranja (1.85:1 en claro, 1.34:1 en oscuro) y dejaría de ser visible.
  focusRing: {
    color: theme.focus,
    width: focus.width,
    offset: focus.offset,
    style: "solid",
  },

  layout: {
    gap: space[3],
    section: space[6],
    minTouch: control.minSize,
  },
});

export { radius, space, control, focus };
