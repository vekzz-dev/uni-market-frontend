import estilos from "./Aviso.module.css";

export function Aviso({ tono = "error", children }) {
  return (
    <div role="alert" className={`${estilos.aviso} ${estilos[tono]}`}>
      {children}
    </div>
  );
}
