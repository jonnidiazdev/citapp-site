import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export const Layout: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    logout();
    navigate('/');
  };

  return (
    <div>
      {user && (
        <nav className="navbar">
          <div className="navbar-content">
            <h1>CitApp</h1>
            <div className="navbar-actions">
              <span>{user.name}</span>
              <button onClick={handleLogout}>Cerrar Sesión</button>
            </div>
          </div>
        </nav>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
};
