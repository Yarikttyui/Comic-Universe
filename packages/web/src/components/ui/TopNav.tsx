import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BookOpen, Home, Library, Download, Sun, Moon, LogIn, User, Menu, X, Sparkles } from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Button, LinkButton } from './Button';
import { NotificationBell } from './NotificationBell';

const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');

export function TopNav() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showBecomeAuthor = isAuthenticated && user?.role === 'reader';
  const showDownload = isAuthenticated && !isElectron;

  return (
    <header className="top-nav">
      <div className="container top-nav-inner">
        <div className="cluster">
          <button className="mobile-menu-trigger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="brand-link">
            <div className="brand-mark"><BookOpen size={20} strokeWidth={3} /></div>
            <span className="brand-text">Comic Universe</span>
          </Link>
        </div>

        <nav className="nav-links desktop-only">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Home size={18} /> Главная
          </NavLink>
          <NavLink to="/library" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Library size={18} /> Библиотека
          </NavLink>
          {showDownload && (
            <NavLink to="/downloads" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Download size={18} /> Скачать
            </NavLink>
          )}

        </nav>

        <div className="top-nav-actions">
          <NotificationBell />
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Сменить тему">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {!isAuthenticated ? (
            <>
              <LinkButton to="/login" variant="ghost" size="md" className="desktop-only">Войти</LinkButton>
              <LinkButton to="/register" variant="primary" size="md" className="desktop-only">Регистрация</LinkButton>
            </>
          ) : (
            <>
              {showBecomeAuthor ? (
                <LinkButton to="/profile" variant="outline" size="md" className="desktop-only">
                  Стать автором
                </LinkButton>
              ) : null}
              <LinkButton to="/profile" variant="ghost" size="md" leftIcon={<User size={18} />} className="desktop-only">
                {user?.displayName || 'Профиль'}
              </LinkButton>
              <Button variant="ghost" size="md" onClick={logout} className="desktop-only">Выйти</Button>
            </>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-list">
            <NavLink to="/" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
              <Home size={18} /> Главная
            </NavLink>
            <NavLink to="/library" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
              <Library size={18} /> Библиотека
            </NavLink>
            {showDownload && (
              <NavLink to="/downloads" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                <Download size={18} /> Скачать
              </NavLink>
            )}
            {showBecomeAuthor && (
              <Link to="/profile" className="mobile-nav-item highlight" onClick={() => setIsMobileMenuOpen(false)}>
                <Sparkles size={18} /> Стать автором
              </Link>
            )}

            <div className="mobile-nav-divider" />

            {!isAuthenticated ? (
              <>
                <Link to="/login" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <LogIn size={18} /> Войти
                </Link>
                <Link to="/register" className="mobile-nav-item highlight" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} /> Регистрация
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} /> Профиль
                </Link>
                <button className="mobile-nav-item" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>Выйти</button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
