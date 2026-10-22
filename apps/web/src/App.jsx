import { Route, Routes } from 'react-router-dom';
import { Entrar } from './pantallas/Entrar.jsx';
import { Registro } from './pantallas/Registro.jsx';
import { Confirmar } from './pantallas/Confirmar.jsx';
import { Restablecer } from './pantallas/Restablecer.jsx';
import { NuevaContrasena } from './pantallas/NuevaContrasena.jsx';
import { Reenviar } from './pantallas/Reenviar.jsx';
import { Catalogo } from './pantallas/Catalogo.jsx';
import { Detalle } from './pantallas/Detalle.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Catalogo />} />
      <Route path="/anuncios/:id" element={<Detalle />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/confirmar-email" element={<Confirmar />} />
      <Route path="/restablecer" element={<Restablecer />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
      <Route path="/reenviar" element={<Reenviar />} />
    </Routes>
  );
}
