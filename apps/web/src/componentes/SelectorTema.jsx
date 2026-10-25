import { useEffect, useState } from "react";
import { Icono } from "./Icono.jsx";
import {
  ETIQUETAS,
  aplicarTema,
  guardarTema,
  leerTema,
  siguienteTema,
} from "../tema.js";
import estilos from "./SelectorTema.module.css";

const ICONOS = { sistema: "monitor", claro: "sol", oscuro: "luna" };

/** Conmutador de tema: sistema → claro → oscuro → sistema. */
export function SelectorTema() {
  const [tema, setTema] = useState(() => leerTema());

  useEffect(() => {
    aplicarTema(tema);
    guardarTema(tema);
  }, [tema]);

  const siguiente = siguienteTema(tema);

  return (
    <button
      type="button"
      className={estilos.boton}
      aria-label={`${ETIQUETAS[tema]}. Cambiar a ${ETIQUETAS[siguiente].toLowerCase()}`}
      title={`${ETIQUETAS[tema]} · cambiar a ${ETIQUETAS[siguiente].toLowerCase()}`}
      onClick={() => setTema(siguiente)}
    >
      <Icono nombre={ICONOS[tema]} tamano={18} />
    </button>
  );
}
