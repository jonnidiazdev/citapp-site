import { useActionState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
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

export function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  if (!isRegistrationAllowed()) {
    return <Navigate to="/login" replace />;
  }

  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden' };
      }
      if (password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      try {
        const user = await authService.register(
          formData.get('email') as string,
          password,
          formData.get('name') as string,
          'admin'
        );
        register(user);
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
          <h2>Empezá en minutos</h2>
          <p>Creá tu cuenta, configurá tu negocio y compartí el link de reservas con tus clientes.</p>
        </div>
      </aside>
      <div className="auth-main">
      <div className="auth-form">
        <h1>CitApp</h1>
        <h2>Crear Cuenta</h2>

        {state?.error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div className="form-group">
            <label htmlFor="name">Nombre Completo</label>
            <input id="name" name="name" type="text" required placeholder="Tu nombre" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="tu@email.com" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          <SubmitButton label="Registrarse" />
        </form>

        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
