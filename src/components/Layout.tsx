import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export function Layout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      {user && (
        <nav className="navbar" aria-label="Navegación principal">
          <div className="navbar-content">
            <Link to="/admin/dashboard" className="navbar-brand">
              <strong>CitApp</strong>
              <span>Panel de gestión</span>
            </Link>
            <div className="navbar-actions">
              <span className="navbar-user">{user.name}</span>
              <button type="button" className="button secondary" onClick={() => navigate('/admin/settings')}>
                Configuración
              </button>
              <button type="button" className="button ghost" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </nav>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
