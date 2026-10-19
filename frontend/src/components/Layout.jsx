import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../session';
import Icon from './Icon';
import logo from '../assets/ase-logo.png';

const SIDEBAR_KEY = 'sidebar';

function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = getSession()?.user;
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== 'expanded');
  const [menuOpen, setMenuOpen] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = event => {
      if (!userRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  function toggle() {
    setCollapsed(!collapsed);
    localStorage.setItem(SIDEBAR_KEY, collapsed ? 'expanded' : 'collapsed');
  }

  function logout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  const toggleLabel = collapsed ? 'Deschide meniul' : 'Închide meniul';

  return (
    <div className={collapsed ? 'layout collapsed' : 'layout'}>
      <aside className="sidebar">
        <div className="sidebar-inner">
          <Link to="/" className="sidebar-logo">
            <img src={logo} alt="Academia de Studii Economice din București" />
          </Link>

          <nav className="sidebar-nav">
            <NavLink to="/" end className="sidebar-link" title="Cursurile mele">
              <Icon name="courses" />
              <span>Cursurile mele</span>
            </NavLink>
          </nav>

          <div className="sidebar-footer" ref={userRef}>
            <button
              type="button"
              className="user-button"
              onClick={() => setMenuOpen(!menuOpen)}
              title={`${user?.name}\n${user?.email}`}
              aria-expanded={menuOpen}
            >
              <span className="avatar">{initials(user?.name)}</span>
              <span className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-email">{user?.email}</span>
              </span>
            </button>

            {menuOpen && (
              <div className="user-menu">
                <div className="user-menu-name">{user?.name}</div>
                <div className="user-menu-email">{user?.email}</div>
                <button type="button" className="user-menu-item" onClick={logout}>
                  <Icon name="logout" />
                  Ieșire
                </button>
              </div>
            )}
          </div>
        </div>

        <button type="button" className="sidebar-toggle" onClick={toggle} title={toggleLabel} aria-label={toggleLabel}>
          <Icon name={collapsed ? 'right' : 'left'} />
        </button>
      </aside>

      <main className="page">{children}</main>
    </div>
  );
}
