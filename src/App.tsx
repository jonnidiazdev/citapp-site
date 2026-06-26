import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStateListener } from './hooks/useAuthStateListener';
import { ToastProvider } from './components/ui/ToastProvider';
import { ToastContainer } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/ConfirmProvider';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { PublicBooking } from './pages/PublicBooking';

const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

function PageLoader() {
  return <div className="page-loader">Cargando...</div>;
}

function App() {
  useAuthStateListener();

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/booking/:userId" element={<PublicBooking />} />

              <Route element={<Layout />}>
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
          <ToastContainer />
        </Router>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
