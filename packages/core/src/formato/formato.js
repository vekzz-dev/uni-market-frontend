// Formato de valores visibles. Una sola fuente para web y móvil (D18).

const MONEDA = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});
const FECHA = new Intl.DateTimeFormat("es-SV", { dateStyle: "medium" });

/** Precio en USD. El contrato no envía moneda: se asume USD (D18). */
export function formatearPrecio(precio) {
  // Ausente no es cero: un precio nulo no debe mostrarse como $0.00.
  if (precio === null || precio === undefined || precio === "") return "—";
  const numero = Number(precio);
  if (!Number.isFinite(numero)) return "—";
  return MONEDA.format(numero);
}

/** Fecha legible a partir del ISO del contrato. */
export function formatearFecha(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return FECHA.format(fecha);
}

/** "Hace 2 días" con el reloj inyectable (las pruebas no leen la fecha del sistema). */
export function formatearFechaRelativa(iso, ahora = Date.now()) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";

  const segundos = Math.max(0, Math.round((ahora - fecha.getTime()) / 1000));

  if (segundos < 60)
    return segundos <= 1 ? "hace 1 segundo" : `hace ${segundos} segundos`;

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60)
    return minutos === 1 ? "hace 1 minuto" : `hace ${minutos} minutos`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "hace 1 hora" : `hace ${horas} horas`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return dias === 1 ? "hace 1 día" : `hace ${dias} días`;

  return formatearFecha(iso);
}
