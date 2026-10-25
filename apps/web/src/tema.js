// Tema claro/oscuro con tres estados: sistema (por defecto), claro y oscuro.
// El generador de tokens expone `data-um-theme="light|dark"` para forzar el tema;
// sin atributo, manda `prefers-color-scheme`.

const CLAVE = "umi.tema";
export const TEMAS = ["sistema", "claro", "oscuro"];

export function leerTema() {
  try {
    const guardado = globalThis.localStorage?.getItem(CLAVE);
    return TEMAS.includes(guardado) ? guardado : "sistema";
  } catch {
    return "sistema";
  }
}

export function guardarTema(tema) {
  try {
    globalThis.localStorage?.setItem(CLAVE, tema);
  } catch {
    // Modo privado: el tema se aplica igual, solo no persiste.
  }
}

export function aplicarTema(tema) {
  const raiz = globalThis.document?.documentElement;
  if (!raiz) return;

  if (tema === "claro") raiz.dataset.umTheme = "light";
  else if (tema === "oscuro") raiz.dataset.umTheme = "dark";
  else delete raiz.dataset.umTheme;
}

export function siguienteTema(tema) {
  const indice = TEMAS.indexOf(tema);
  return TEMAS[(indice + 1) % TEMAS.length];
}

export const ETIQUETAS = {
  sistema: "Tema del sistema",
  claro: "Tema claro",
  oscuro: "Tema oscuro",
};
