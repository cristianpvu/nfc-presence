import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getSession, isAdmin } from '../session';
import Icon from './Icon';
import { initials } from '../names';
import ChangePasswordModal from './ChangePasswordModal';
import logo from '../assets/ase-logo.png';

const SIDEBAR_KEY = 'sidebar';
const MOBILE_QUERY = '(max-width: 600px)';

const PROFESSOR_LINKS = [{ to: '/', label: 'Cursurile mele', icon: 'courses', end: true }];

const ADMIN_LINKS = [
  { to: '/admin/courses', label: 'Cursuri', icon: 'courses' },
  { to: '/admin/rooms', label: 'Săli', icon: 'rooms' },
  { to: '/admin/users', label: 'Utilizatori', icon: 'users' },
  { to: '/admin/logs', label: 'Log', icon: 'log' },
];

function useMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return mobile;
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = getSession()?.user;
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== 'expanded');
  const [menuOpen, setMenuOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mobile = useMobile();
  const userRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = event => {
      if (!userRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = event => event.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [drawerOpen]);

  function toggle() {
    setCollapsed(!collapsed);
    localStorage.setItem(SIDEBAR_KEY, collapsed ? 'expanded' : 'collapsed');
  }

  function openChangePassword() {
    setMenuOpen(false);
    setChangingPassword(true);
  }

  function logout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  const toggleLabel = collapsed ? 'Deschide meniul' : 'Închide meniul';
  const closeDrawer = () => setDrawerOpen(false);
  const layoutClass = ['layout', collapsed && !mobile && 'collapsed', drawerOpen && 'drawer-open'].filter(Boolean).join(' ');

  const userSection = (
    <div className={mobile ? 'topbar-user' : 'sidebar-footer'} ref={userRef}>
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
          <button type="button" className="user-menu-item" onClick={openChangePassword}>
            <Icon name="key" />
            Schimbare parolă
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={layoutClass}>
      {mobile && (
        <header className="topbar">
          <button type="button" className="topbar-menu" onClick={() => setDrawerOpen(true)} aria-label="Deschide meniul">
            <Icon name="menu" />
          </button>
          <Link to="/" className="topbar-logo">
            <img src={logo} alt="Academia de Studii Economice din București" />
          </Link>
          {userSection}
        </header>
      )}

      {mobile && drawerOpen && <div className="drawer-backdrop" onClick={closeDrawer} />}

      <aside className="sidebar">
        <div className="sidebar-inner">
          <Link to="/" className="sidebar-logo" onClick={closeDrawer}>
            <img src={logo} alt="Academia de Studii Economice din București" />
          </Link>

          <nav className="sidebar-nav">
            {(isAdmin() ? ADMIN_LINKS : PROFESSOR_LINKS).map(link => (
              <NavLink key={link.to} to={link.to} end={link.end} className="sidebar-link" title={link.label} onClick={closeDrawer}>
                <Icon name={link.icon} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {!mobile && userSection}
        </div>

        <button type="button" className="sidebar-toggle" onClick={toggle} title={toggleLabel} aria-label={toggleLabel}>
          <Icon name={collapsed ? 'right' : 'left'} />
        </button>
      </aside>

      <main className="page">{children}</main>

      {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
    </div>
  );
}
