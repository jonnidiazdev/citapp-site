import { useNavigate, Link } from 'react-router-dom';
import { FiCalendar, FiLink, FiSettings, FiBarChart2 } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import { isRegistrationAllowed } from '../utils/featureFlags';
import '../styles/home.css';

const features = [
  {
    icon: FiCalendar,
    title: 'Calendario claro',
    description: 'Visualizá y gestioná todos tus turnos en un panel organizado por fecha.',
  },
  {
    icon: FiLink,
    title: 'Link de reservas',
    description: 'Compartí un enlace único para que tus clientes agenden sin crear cuenta.',
  },
  {
    icon: FiSettings,
    title: 'Horarios flexibles',
    description: 'Configurá días, duración de turnos, recesos y límites diarios.',
  },
  {
    icon: FiBarChart2,
    title: 'Estado al día',
    description: 'Seguí pendientes, confirmados y turnos del día desde el dashboard.',
  },
] as const;

export function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-hero">
        <div className="home-hero-inner container">
          <p className="home-eyebrow">Gestión de turnos</p>
          <h1>Tu agenda, lista para compartir</h1>
          <p className="home-lead">
            CitApp ayuda a negocios locales a organizar citas, publicar disponibilidad y recibir
            reservas online sin fricción.
          </p>
          <div className="home-cta">
            {!isAuthenticated ? (
              <>
                <button type="button" className="button" onClick={() => navigate('/login')}>
                  Iniciar sesión
                </button>
                {isRegistrationAllowed() && (
                  <button type="button" className="button secondary" onClick={() => navigate('/register')}>
                    Crear cuenta
                  </button>
                )}
              </>
            ) : (
              <button type="button" className="button" onClick={() => navigate('/admin/dashboard')}>
                Ir al panel
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="home-features container" aria-labelledby="features-heading">
        <div className="home-features-header">
          <h2 id="features-heading">Todo lo que necesitás para agendar</h2>
          <p>Herramientas pensadas para dueños de negocio y sus clientes.</p>
        </div>
        <div className="home-features-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="home-feature-card">
              <div className="home-feature-icon" aria-hidden="true">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="container home-footer-inner">
          <Link to="/" className="home-footer-brand">
            CitApp
          </Link>
          <p>Turnos simples para negocios locales.</p>
        </div>
      </footer>
    </div>
  );
}
