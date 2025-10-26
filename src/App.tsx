import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AgendaPage } from '@/pages/AgendaPage';
import { MateriaDetailPage } from '@/pages/MateriaDetailPage';
import { AjustesPage } from '@/pages/AjustesPage';
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/materias/:id"
          element={<ProtectedRoute><MateriaDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/agenda"
          element={<ProtectedRoute><AgendaPage /></ProtectedRoute>}
        />
        <Route
          path="/ajustes"
          element={<ProtectedRoute><AjustesPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;