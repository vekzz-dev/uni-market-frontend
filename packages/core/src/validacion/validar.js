// Validación espejo: reproduce en el cliente lo que el contrato declara
// (docs/api-integration.md §3.3). No inventa reglas y nunca sustituye al servidor:
// un 422 del servidor se sigue mostrando.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PRECIO = 99_999_999.99;
const MAX_IMAGENES = 5;
const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;
const MAX_BYTES_AVATAR = 2 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const enBlanco = (valor) => typeof valor !== "string" || valor.trim() === "";

/** @returns {Array<{campo:string, mensaje:string}>} lista vacía si todo está bien */
export function validarRegistro({ nombre, email, contrasena } = {}) {
  const errores = [];

  if (enBlanco(nombre))
    errores.push({ campo: "nombre", mensaje: "Escribe tu nombre." });

  if (enBlanco(email)) {
    errores.push({ campo: "email", mensaje: "Escribe tu correo." });
  } else if (!EMAIL.test(email.trim())) {
    errores.push({ campo: "email", mensaje: "Ese correo no parece válido." });
  }

  // Mínimo 8, sin reglas de composición (política del contrato).
  if (typeof contrasena !== "string" || contrasena.length < 8) {
    errores.push({
      campo: "contrasena",
      mensaje: "La contraseña necesita al menos 8 caracteres.",
    });
  }

  return errores;
}

/** @returns {string|null} mensaje de error o null */
export function validarPrecio(precio) {
  if (precio === null || precio === undefined || precio === "")
    return "Escribe un precio.";
  const numero = Number(precio);
  if (!Number.isFinite(numero)) return "El precio no es un número válido.";
  if (numero < 0) return "El precio no puede ser negativo.";
  if (numero > MAX_PRECIO) return "El precio supera el máximo permitido.";
  return null;
}

/** @returns {string|null} */
export function validarImagenes(archivos) {
  if (!Array.isArray(archivos) || archivos.length === 0)
    return "Agrega al menos una imagen.";
  if (archivos.length > MAX_IMAGENES)
    return `Puedes subir hasta ${MAX_IMAGENES} imágenes.`;

  for (const archivo of archivos) {
    if (archivo?.size > MAX_BYTES_IMAGEN)
      return "Cada imagen debe pesar como máximo 5 MB.";
    if (archivo?.type && !TIPOS_IMAGEN.includes(archivo.type)) {
      return "Formato no admitido: usa JPG, PNG, GIF o WEBP.";
    }
  }

  return null;
}

/** @returns {string|null} */
export function validarAvatar(archivo) {
  if (!archivo) return "Elige una imagen.";
  if (archivo.size > MAX_BYTES_AVATAR)
    return "El avatar debe pesar como máximo 2 MB.";
  if (archivo.type && !TIPOS_IMAGEN.includes(archivo.type)) {
    return "Formato no admitido: usa JPG, PNG, GIF o WEBP.";
  }
  return null;
}

/** @returns {string|null} el contrato recorta y rechaza vacío */
export function validarMensaje(texto) {
  return enBlanco(texto) ? "Escribe un mensaje." : null;
}

/** @returns {string|null} motivo obligatorio al rechazar o retraer */
export function validarMotivo(motivo) {
  return enBlanco(motivo) ? "Explica el motivo de la decisión." : null;
}
