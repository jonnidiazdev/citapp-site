import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormStatus } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { isRegistrationAllowed } from '../utils/featureFlags';
import '../styles/auth.css';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? 'Cargando...' : label}
    </button>
  );
}

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        const user = await authService.login(
          formData.get('email') as string,
          formData.get('password') as string
        );
        login(user);
        navigate('/admin/dashboard');
        return null;
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'An error occurred' };
      }
    },
    null
  );

  return (
    <div className="auth-container">
      <aside className="auth-panel" aria-hidden="true">
        <div className="auth-panel-inner">
          <p className="auth-panel-eyebrow">CitApp</p>
          <h2>Tu negocio, en orden</h2>
          <p>Configurá horarios, compartí tu link de reservas y recibí turnos sin perder el control.</p>
        </div>
      </aside>
      <div className="auth-main">
      <div className="auth-form">
        <h1>CitApp</h1>
        <h2>Iniciar Sesión</h2>

        {state?.error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="tu@email.com" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <SubmitButton label="Iniciar Sesión" />
        </form>

        <p className="auth-link">
          {isRegistrationAllowed() && (
            <>
              ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
            </>
          )}
        </p>
      </div>
      </div>
    </div>
  );
}
