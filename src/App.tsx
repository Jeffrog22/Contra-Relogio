import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { CarregarPage } from './pages/CarregarPage';
import { ListaPage } from './pages/ListaPage';
import { BalizamentoPage } from './pages/BalizamentoPage';
import { ControlePage } from './pages/ControlePage';
import { AnalisePage } from './pages/AnalisePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/lista" replace />} />
        <Route path="/carregar" element={<CarregarPage />} />
        <Route path="/lista" element={<ListaPage />} />
        <Route path="/balizamento" element={<BalizamentoPage />} />
        <Route path="/controle" element={<ControlePage />} />
        <Route path="/analise" element={<AnalisePage />} />
        <Route path="*" element={<Navigate to="/lista" replace />} />
      </Route>
    </Routes>
  );
}
