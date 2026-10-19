import { Link, useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../session';

export default function Header() {
  const navigate = useNavigate();
  const user = getSession()?.user;

  function logout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">Prezență NFC</Link>
      <div className="navbar-user">
        <span>{user?.name}</span>
        <button type="button" className="btn btn-link" onClick={logout}>Ieșire</button>
      </div>
    </header>
  );
}
