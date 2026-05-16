import React, { useState, useRef, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Dumbbell, LayoutDashboard, Users, MapPin, MessageCircle,
  Menu, X, Bell, Swords,
} from 'lucide-react';
import './Header.css';

const NAV_TABS = [
  { path: '/dashboard',       label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workouts',        label: 'Workouts',  icon: Dumbbell },
  { path: '/partners',        label: 'Partners',  icon: Users },
  { path: '/shared-workouts', label: 'Compete',   icon: Swords },
  { path: '/gyms',            label: 'Gyms',      icon: MapPin },
  { path: '/chat',            label: 'Chat',      icon: MessageCircle },
];

const Header = () => {
  const { user, isAuthenticated, isAdmin, isTrainer, login, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0 });

  const activeTab = NAV_TABS.find(t =>
    location.pathname === t.path || location.pathname.startsWith(t.path + '/')
  );

  useLayoutEffect(() => {
    const measure = () => {
      const activeId = activeTab?.path;
      const el = tabRefs.current[activeId];
      const wrap = containerRef.current;
      if (!el || !wrap) return;
      const r = el.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      if (r.height < 20) return;
      setInd({ left: r.left - w.left, width: r.width });
    };
    measure();
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    return () => {
      cancelAnimationFrame(raf1); cancelAnimationFrame(raf2);
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, [activeTab?.path]);

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || user.username?.[1] || '')).toUpperCase() || '??'
    : '??';
  const displayName = user?.firstName || user?.username || '';
  const role = isAdmin ? 'ADMIN' : isTrainer ? 'TRAINER' : null;

  return (
    <header className="hdr">
      <div className="hdr-inner">
        {/* Logo */}
        <Link to="/" className="hdr-logo">
          <span className="hdr-logo-icon">
            <Dumbbell size={18} strokeWidth={2.5} />
          </span>
          <span className="hdr-logo-text">Workout Partner</span>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <div ref={containerRef} className="hdr-nav">
            {/* Sliding pill indicator */}
            {activeTab && (
              <span
                className="hdr-nav-indicator"
                style={{ left: ind.left, width: ind.width }}
              />
            )}
            {NAV_TABS.map(tab => {
              if (tab.path === '/trainers' && !isTrainer) return null;
              const isActive = activeTab?.path === tab.path;
              const TabIcon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  ref={el => tabRefs.current[tab.path] = el}
                  className={`hdr-tab ${isActive ? 'hdr-tab--active' : ''}`}
                >
                  <TabIcon size={16} strokeWidth={2.25} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right cluster */}
        <div className="hdr-right">
          {isAuthenticated ? (
            <>
              <button className="hdr-bell" aria-label="Notifications">
                <Bell size={18} />
                <span className="hdr-bell-dot" />
              </button>

              <div className="hdr-user-cluster">
                <div className="hdr-avatar">{initials}</div>
                <div className="hdr-user-info">
                  <span className="hdr-user-name">{displayName}</span>
                  {role && (
                    <span className="hdr-role-chip">{role}</span>
                  )}
                </div>
                <button onClick={logout} className="hdr-logout">Logout</button>
              </div>
            </>
          ) : (
            <button onClick={login} className="hdr-login">Login</button>
          )}

          {/* Hamburger */}
          {isAuthenticated && (
            <button
              className="hdr-hamburger"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && isAuthenticated && (
        <div className="hdr-mobile-drawer">
          {NAV_TABS.map(tab => {
            const isActive = activeTab?.path === tab.path;
            const TabIcon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`hdr-mobile-tab ${isActive ? 'hdr-mobile-tab--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <TabIcon size={18} />
                {tab.label}
              </Link>
            );
          })}
          <div className="hdr-mobile-footer">
            <div className="hdr-avatar">{initials}</div>
            <div className="hdr-mobile-user-info">
              <span className="hdr-user-name">{displayName}</span>
              <span className="hdr-mobile-signed">Signed in</span>
            </div>
            {role && <span className="hdr-role-chip">{role}</span>}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
