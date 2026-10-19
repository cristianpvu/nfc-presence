import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getSession, saveSession } from '../session';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (getSession()) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const session = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      saveSession(session);
      navigate('/', { replace: true, state: { fromLogin: true } });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="card login-card">
        <h1 className="login-title">Prezență NFC</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <label className="form-label" htmlFor="email">Adresă de email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
          <label className="form-label" htmlFor="password">Parolă</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Se autentifică...' : 'Autentificare'}
          </button>
        </form>
      </div>
    </main>
  );
}
