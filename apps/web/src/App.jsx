import { Route, Routes } from 'react-router-dom';
import { Entrar } from './pantallas/Entrar.jsx';
import { Registro } from './pantallas/Registro.jsx';
import { Confirmar } from './pantallas/Confirmar.jsx';
import { Inicio } from './pantallas/Inicio.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/confirmar-email" element={<Confirmar />} />
    </Routes>
  );
}
