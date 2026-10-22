import { Route, Routes } from 'react-router-dom';
import { Entrar } from './pantallas/Entrar.jsx';
import { Registro } from './pantallas/Registro.jsx';
import { Confirmar } from './pantallas/Confirmar.jsx';
import { Restablecer } from './pantallas/Restablecer.jsx';
import { NuevaContrasena } from './pantallas/NuevaContrasena.jsx';
import { Reenviar } from './pantallas/Reenviar.jsx';
import { Inicio } from './pantallas/Inicio.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/confirmar-email" element={<Confirmar />} />
      <Route path="/restablecer" element={<Restablecer />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
      <Route path="/reenviar" element={<Reenviar />} />
    </Routes>
  );
}
