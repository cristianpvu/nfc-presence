import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../session';
import logo from '../assets/ase-logo.png';

const COLLAPSED_KEY = 'sidebarCollapsed';

function readCollapsed() {
  const saved = localStorage.getItem(COLLAPSED_KEY);
  return saved === null ? window.innerWidth < 768 : saved === 'true';
}

function Icon({ path }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  courses: 'M4 5h16M4 12h16M4 19h16',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10',
  collapse: 'M15 6l-6 6 6 6',
  expand: 'M9 6l6 6-6 6',
};

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = getSession()?.user;
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggle() {
    setCollapsed(!collapsed);
    localStorage.setItem(COLLAPSED_KEY, String(!collapsed));
  }

  function logout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className={collapsed ? 'layout collapsed' : 'layout'}>
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          <img src={logo} alt="Academia de Studii Economice din București" />
        </Link>

        <nav className="sidebar-nav">
          <NavLink to="/" end className="sidebar-link" title="Cursurile mele">
            <Icon path={ICONS.courses} />
            <span>Cursurile mele</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" title={user?.name}>{user?.name}</div>
          <button type="button" className="sidebar-link" onClick={logout} title="Ieșire">
            <Icon path={ICONS.logout} />
            <span>Ieșire</span>
          </button>
          <button
            type="button"
            className="sidebar-link"
            onClick={toggle}
            title={collapsed ? 'Extinde meniul' : 'Restrânge meniul'}
          >
            <Icon path={collapsed ? ICONS.expand : ICONS.collapse} />
            <span>Restrânge</span>
          </button>
        </div>
      </aside>

      <main className="page">{children}</main>
    </div>
  );
}
