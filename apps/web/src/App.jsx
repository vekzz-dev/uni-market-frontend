import { Route, Routes } from "react-router-dom";
import { Entrar } from "./pantallas/Entrar.jsx";
import { Registro } from "./pantallas/Registro.jsx";
import { Confirmar } from "./pantallas/Confirmar.jsx";
import { Restablecer } from "./pantallas/Restablecer.jsx";
import { NuevaContrasena } from "./pantallas/NuevaContrasena.jsx";
import { Reenviar } from "./pantallas/Reenviar.jsx";
import { Catalogo } from "./pantallas/Catalogo.jsx";
import { Detalle } from "./pantallas/Detalle.jsx";
import { NoEncontrado } from "./pantallas/NoEncontrado.jsx";
import { Publicar } from "./pantallas/Publicar.jsx";
import { MisAnuncios } from "./pantallas/MisAnuncios.jsx";
import { EditarAnuncio } from "./pantallas/EditarAnuncio.jsx";
import { Mensajes } from "./pantallas/Mensajes.jsx";
import { Conversacion } from "./pantallas/Conversacion.jsx";
import { Perfil } from "./pantallas/Perfil.jsx";
import { Moderacion } from "./pantallas/Moderacion.jsx";
import { AdminUsuarios } from "./pantallas/AdminUsuarios.jsx";
import { AdminCategorias } from "./pantallas/AdminCategorias.jsx";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Catalogo />} />
      <Route path="/anuncios/:id" element={<Detalle />} />
      <Route path="/publicar" element={<Publicar />} />
      <Route path="/mis-anuncios" element={<MisAnuncios />} />
      <Route path="/mis-anuncios/:id/editar" element={<EditarAnuncio />} />
      <Route path="/mensajes" element={<Mensajes />} />
      <Route path="/mensajes/:id" element={<Conversacion />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/moderacion" element={<Moderacion />} />
      <Route path="/admin/usuarios" element={<AdminUsuarios />} />
      <Route path="/admin/categorias" element={<AdminCategorias />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/confirmar-email" element={<Confirmar />} />
      <Route path="/restablecer" element={<Restablecer />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
      <Route path="/reenviar" element={<Reenviar />} />
      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}
