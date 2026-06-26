import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormStatus } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import '../styles/auth.css';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
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
      <div className="auth-form">
        <h1>CitApp</h1>
        <h2>Iniciar Sesión</h2>

        {state?.error && <div className="error-message">{state.error}</div>}

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
          ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
        </p>
      </div>
    </div>
  );
}
