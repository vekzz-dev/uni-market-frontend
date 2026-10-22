/**
 * Iconos de línea del sistema (trazo de 2 px, 24×24, `currentColor`).
 * Son decorativos: siempre acompañan a un texto que dice lo mismo.
 */
const TRAZOS = {
  correo: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  exito: <path d="M20 6 9 17l-5-5" />,
  enlaceRoto: (
    <>
      <path d="M9 17H7A5 5 0 0 1 7 7" />
      <path d="M15 7h2a5 5 0 0 1 4 8" />
      <line x1="8" x2="12" y1="12" y2="12" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </>
  ),
  cargando: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
};

export function Icono({ nombre, tamano = 22 }) {
  const trazos = TRAZOS[nombre];
  if (!trazos) return null;

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      {trazos}
    </svg>
  );
}
