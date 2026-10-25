import estilos from "./Boton.module.css";

export function Boton({
  variante = "primario",
  cargando = false,
  children,
  ...props
}) {
  const clase = [estilos.boton, estilos[variante], props.className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={clase}
      disabled={props.disabled || cargando}
      aria-busy={cargando || undefined}
    >
      {children}
    </button>
  );
}
