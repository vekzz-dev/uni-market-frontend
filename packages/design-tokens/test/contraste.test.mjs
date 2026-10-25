// Verificación de contraste (WCAG 2.2 AA) de TODOS los pares que la interfaz usa.
// Esto es la auditoría convertida en prueba: si alguien "mejora" un color y rompe
// la accesibilidad, la suite falla con el número exacto.
//
// Umbrales aplicados:
//   4.5:1  texto normal                     (WCAG 1.4.3 AA)
//   3.0:1  componentes e indicadores         (WCAG 1.4.11 AA) — incluye el foco
//
// Pares deliberadamente NO verificados, con su motivo:
//   - border / borderStrong sobre superficies: son decorativos (1.24:1 y 1.47:1).
//     No identifican ningún control, así que 1.4.11 no aplica. El borde que SÍ
//     identifica un control es `borderField`, y ese se verifica en las TRES
//     superficies (blanco, fondo y hover), no solo sobre blanco.
//   - El anillo de foco contra el relleno naranja del botón (1.85:1 en claro,
//     1.34:1 en oscuro): por eso el anillo lleva `outline-offset` obligatorio y
//     su color se compara contra la superficie, que es lo que queda adyacente.
//   - El naranja de marca (#F97316) como texto o icono sobre fondo claro: se
//     verifica al revés (debe FALLAR), porque es un color de relleno.

import { test } from "node:test";
import assert from "node:assert/strict";

import { light, dark } from "../src/semantic.js";

const lum = (hex) => {
  const canales = hex
    .replace("#", "")
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255)
    .map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
    );
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
};

export const contraste = (a, b) => {
  const [claro, oscuro] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
};

const TEXTO = 4.5;
const COMPONENTE = 3.0;

/** [nombre, colorA, colorB] — roles de texto: exigen 4.5:1. */
const paresDeTexto = (t) => [
  ["texto principal sobre fondo", t.text, t.bg],
  ["texto principal sobre tarjeta", t.text, t.surface],
  ["texto principal sobre hover", t.text, t.surfaceHover],
  ["texto secundario sobre fondo", t.textSecondary, t.bg],
  ["texto secundario sobre tarjeta", t.textSecondary, t.surface],
  ["texto secundario sobre hover", t.textSecondary, t.surfaceHover],
  ["enlace sobre tarjeta", t.link, t.surface],
  ["enlace sobre fondo", t.link, t.bg],
  ["enlace en hover sobre fondo", t.linkHover, t.bg],
  [
    "insignia pendiente (texto/advertencia suave)",
    t.warningText,
    t.warningSoft,
  ],
  ["insignia aprobada (texto/éxito suave)", t.successText, t.successSoft],
  ["insignia rechazada (texto/error suave)", t.errorText, t.errorSoft],
  ["insignia informativa (texto/info suave)", t.infoText, t.infoSoft],
  ["insignia vendida (secundario/hover)", t.textSecondary, t.surfaceHover],
  ["botón primario normal", t.textOnPrimary, t.primary],
  ["botón primario hover", t.textOnPrimaryStrong, t.primaryHover],
  ["botón primario activo", t.textOnPrimaryStrong, t.primaryActive],
  ["botón de peligro", t.textOnError, t.error],
  ["texto sobre relleno informativo", t.textOnInfo, t.info],
];

/** [nombre, colorA, colorB] — componentes e indicadores: exigen 3:1. */
const paresDeComponente = (t) => [
  ["borde de campo sobre tarjeta", t.borderField, t.surface],
  ["borde de campo sobre fondo", t.borderField, t.bg],
  ["borde de campo sobre hover", t.borderField, t.surfaceHover],
  ["foco sobre fondo", t.focus, t.bg],
  ["foco sobre tarjeta", t.focus, t.surface],
  ["foco sobre hover", t.focus, t.surfaceHover],
  ["foco sobre fondo suave de marca", t.focus, t.primarySoft],
  ["foco sobre seleccionado", t.focus, t.primarySelected],
];

/** Deshabilitado: exento de AA (1.4.3), pero se verifica a 4.5:1 por decisión propia. */
const parDeshabilitado = (t) => [
  "texto deshabilitado",
  t.disabledText,
  t.disabledBg,
];

const verificar = (tema, nombreTema) => {
  test(`contraste ${nombreTema}: texto (>= ${TEXTO}:1)`, () => {
    const fallos = paresDeTexto(tema)
      .map(([nombre, a, b]) => ({ nombre, r: contraste(a, b), a, b }))
      .filter(({ r }) => r < TEXTO)
      .map(
        ({ nombre, r, a, b }) => `${nombre}: ${r.toFixed(2)}:1 (${a} / ${b})`,
      );
    assert.deepEqual(
      fallos,
      [],
      `pares de texto por debajo de ${TEXTO}:1 en ${nombreTema}`,
    );
  });

  test(`contraste ${nombreTema}: componentes e indicadores (>= ${COMPONENTE}:1)`, () => {
    const fallos = paresDeComponente(tema)
      .map(([nombre, a, b]) => ({ nombre, r: contraste(a, b), a, b }))
      .filter(({ r }) => r < COMPONENTE)
      .map(
        ({ nombre, r, a, b }) => `${nombre}: ${r.toFixed(2)}:1 (${a} / ${b})`,
      );
    assert.deepEqual(
      fallos,
      [],
      `componentes por debajo de ${COMPONENTE}:1 en ${nombreTema}`,
    );
  });

  test(`contraste ${nombreTema}: el texto deshabilitado también es legible`, () => {
    const [nombre, a, b] = parDeshabilitado(tema);
    const r = contraste(a, b);
    assert.ok(r >= TEXTO, `${nombre}: ${r.toFixed(2)}:1 (${a} / ${b})`);
  });
};

verificar(light, "tema claro");
verificar(dark, "tema oscuro");

test("el gris secundario de la paleta original no habría pasado la verificación", () => {
  // Evidencia del defecto corregido: #6B7280 sobre #F3F4F6 daba 4.39:1.
  assert.ok(contraste("#6B7280", "#F3F4F6") < TEXTO);
  assert.ok(contraste(light.textSecondary, light.surfaceHover) >= TEXTO);
});

test("el hover naranja original no admitía ningún color de texto", () => {
  // #EA580C con blanco = 3.56:1 y con oscuro = 4.40:1: no sirve como relleno con texto.
  assert.ok(contraste("#FFFFFF", "#EA580C") < TEXTO);
  assert.ok(contraste("#431407", "#EA580C") < TEXTO);
});

test("el indicador de foco original no llegaba a 3:1 en ninguna de sus dos partes", () => {
  assert.ok(contraste("#F97316", "#FFFFFF") < COMPONENTE);
  assert.ok(contraste("#FFEDD5", "#FFFFFF") < COMPONENTE);
});

test("el anillo de foco necesita desplazamiento: contra el relleno naranja no alcanza 3:1", () => {
  // En ambos temas: por eso el offset es requisito y no decoración.
  assert.ok(contraste(light.focus, light.primary) < COMPONENTE);
  assert.ok(contraste(dark.focus, dark.primary) < COMPONENTE);
});

test("marca y advertencia son casi indistinguibles: las insignias nunca se rellenan de ámbar", () => {
  // Distancia de luminancia entre ambos tonos: 1.14:1 en el par original.
  assert.ok(contraste("#F97316", "#D97706") < 1.3);
  // La única forma admitida de mostrar "pendiente" es el par suave.
  assert.ok(contraste(light.warningText, light.warningSoft) >= TEXTO);
});

test("el naranja de marca es color de RELLENO, no de texto ni icono sobre fondo claro", () => {
  // 2.80:1 sobre tarjeta y 2.68:1 sobre fondo: no alcanza ni el 3:1 de componente.
  assert.ok(contraste(light.primary, light.surface) < COMPONENTE);
  assert.ok(contraste(light.primary, light.bg) < COMPONENTE);
  // Texto, enlaces e iconos sobre fondo claro usan los pasos oscuros del naranja.
  assert.ok(contraste(light.link, light.surface) >= TEXTO);
  assert.ok(contraste(light.primaryStrong, light.surface) >= TEXTO);
});

test("en tema oscuro el acento sí puede ser texto: por eso se aclara", () => {
  assert.ok(contraste(dark.primary, dark.surface) >= TEXTO);
  assert.ok(contraste(dark.primary, dark.bg) >= TEXTO);
  assert.ok(contraste(dark.link, dark.surface) >= TEXTO);
});

test("el borde de campo pasa el umbral sobre las tres superficies, no solo sobre blanco", () => {
  // Defecto detectado por esta misma suite: #8B93A0 daba 3.10 sobre blanco pero
  // 2.96 sobre el fondo y 2.81 sobre el hover. El valor final se verifica en las tres.
  for (const superficie of [light.surface, light.bg, light.surfaceHover]) {
    assert.ok(
      contraste(light.borderField, superficie) >= COMPONENTE,
      `borde de campo sobre ${superficie}`,
    );
  }
  for (const superficie of [dark.surface, dark.bg, dark.surfaceHover]) {
    assert.ok(
      contraste(dark.borderField, superficie) >= COMPONENTE,
      `borde de campo sobre ${superficie}`,
    );
  }
});
