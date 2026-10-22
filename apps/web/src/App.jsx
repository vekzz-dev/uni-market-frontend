import { Route, Routes } from 'react-router-dom';
import { Entrar } from './pantallas/Entrar.jsx';
import { Inicio } from './pantallas/Inicio.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/entrar" element={<Entrar />} />
    </Routes>
  );
}
