import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Boton } from "../componentes/Boton.jsx";
import { LayoutAuth } from "../componentes/LayoutAuth.jsx";
import { useSesion } from "../sesion/SesionContexto.jsx";

const CONTENIDO = {
  verificando: {
    icono: "cargando",
    girando: true,
    tono: "neutro",
    titulo: "Confirmando tu cuenta…",
    texto: "Estamos verificando el enlace. Tarda solo un momento.",
  },
  confirmado: {
    icono: "exito",
    tono: "exito",
    titulo: "Cuenta confirmada",
    texto: "Ya puedes entrar y publicar tus anuncios.",
  },
  invalido: {
    icono: "enlaceRoto",
    tono: "error",
    titulo: "El enlace no es válido",
    texto:
      "Puede que haya expirado o que ya se haya usado. Los enlaces duran 24 horas.",
  },
};

export function Confirmar() {
  const { cliente } = useSesion();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [estado, setEstado] = useState(token ? "verificando" : "invalido");
  const ejecutado = useRef(false);

  useEffect(() => {
    // El token se consume una sola vez: evita el doble efecto de StrictMode.
    if (ejecutado.current || !token) return;
    ejecutado.current = true;

    cliente.auth
      .confirmarEmail(token)
      .then(() => setEstado("confirmado"))
      .catch(() => setEstado("invalido"));
  }, [cliente, token]);

  const contenido = CONTENIDO[estado];

  return (
    <LayoutAuth
      titulo={contenido.titulo}
      subtitulo={contenido.texto}
      resultado
      icono={{
        nombre: contenido.icono,
        tono: contenido.tono,
        girando: contenido.girando,
      }}
    >
      {estado === "confirmado" && (
        <Boton onClick={() => navegar("/entrar")}>Entrar</Boton>
      )}

      {estado === "invalido" && (
        <Boton variante="secundario" onClick={() => navegar("/entrar")}>
          Ir a entrar
        </Boton>
      )}
    </LayoutAuth>
  );
}
