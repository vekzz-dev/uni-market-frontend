import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.jsx";
import { SesionProvider } from "./sesion/SesionContexto.jsx";
import { aplicarTema, leerTema } from "./tema.js";
import "./estilos/global.css";

aplicarTema(leerTema());

createRoot(document.getElementById("raiz")).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
);
