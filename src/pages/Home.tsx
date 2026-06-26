import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/home.css';

export const Home: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="hero">
        <div className="hero-content">
          <h1>CitApp</h1>
          <p>Gestiona los turnos de tu negocio de forma simple y eficiente</p>
          
          <div className="cta-buttons">
            {!isAuthenticated ? (
              <>
                <button className="button primary" onClick={() => navigate('/login')}>
                  Iniciar Sesión
                </button>
                <button className="button secondary" onClick={() => navigate('/register')}>
                  Registrarse
                </button>
              </>
            ) : (
              <button className="button primary" onClick={() => navigate('/admin/dashboard')}>
                Mi Panel
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="features">
        <h2>Características</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📅 Calendario Inteligente</h3>
            <p>Visualiza y gestiona todos tus turnos de forma clara y organizada</p>
          </div>
          <div className="feature-card">
            <h3>🔗 Links Únicos</h3>
            <p>Genera links personalizados para que tus clientes agenden turnos sin necesidad de registro</p>
          </div>
          <div className="feature-card">
            <h3>⚙️ Gestión Completa</h3>
            <p>Administra horarios, servicios y disponibilidad desde un solo lugar</p>
          </div>
          <div className="feature-card">
            <h3>📊 Estadísticas</h3>
            <p>Visualiza el estado de tus turnos con dashboards en tiempo real</p>
          </div>
        </div>
      </section>
    </div>
  );
};
