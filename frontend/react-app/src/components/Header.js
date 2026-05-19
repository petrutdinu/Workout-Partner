import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api';
import {
  Dumbbell, LayoutDashboard, Users, MapPin, MessageCircle,
  Menu, X, Bell, Swords, LogOut, ChevronDown,
  UserPlus, UserCheck, MessageSquare, Trophy, CheckCheck,
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

const NOTIF_ICONS = {
  partner_request:      UserPlus,
  partner_accepted:     UserCheck,
  new_message:          MessageSquare,
  shared_workout_invite: Trophy,
  shared_workout_joined: Trophy,
};

function notifPath(n) {
  switch (n.type) {
    case 'partner_request':
    case 'partner_accepted':
      return '/partners';
    case 'new_message':
      return n.metadata?.sender_id ? `/chat/${n.metadata.sender_id}` : '/chat';
    case 'shared_workout_invite':
    case 'shared_workout_joined':
      return n.metadata?.session_id ? `/shared-workouts/${n.metadata.session_id}` : '/shared-workouts';
    default:
      return null;
  }
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const POLL_INTERVAL = 5000;

const Header = () => {
  const { user, isAuthenticated, isAdmin, isTrainer, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef(null);
  const bellRef = useRef(null);
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0 });

  // ── outside-click: user menu ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── outside-click: bell ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── notification polling ──────────────────────────────────────
  const fetchCount = useCallback(() => {
    if (!isAuthenticated) return;
    notificationApi.getUnreadCount().then(res => setUnreadCount(res.data?.count ?? 0)).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchCount(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchCount]);

  const openBell = () => {
    setBellOpen(v => {
      if (!v) {
        notificationApi.getAll({ limit: 20 })
          .then(res => setNotifications(res.data || []))
          .catch(() => {});
      }
      return !v;
    });
    setUserMenuOpen(false);
  };

  const handleNotifClick = async (n) => {
    if (!n.is_read) {
      const toMark = n.type === 'new_message' && n.metadata?.sender_id
        ? notifications.filter(x => !x.is_read && x.type === 'new_message' && x.metadata?.sender_id === n.metadata.sender_id)
        : [n];
      await Promise.all(toMark.map(x => notificationApi.markRead(x.id).catch(() => {})));
      const markedIds = new Set(toMark.map(x => x.id));
      setNotifications(prev => prev.map(x => markedIds.has(x.id) ? { ...x, is_read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - toMark.length));
    }
    setBellOpen(false);
    const path = notifPath(n);
    if (path) navigate(path);
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    setUnreadCount(0);
  };

  // ── sliding pill ──────────────────────────────────────────────
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
        <Link to="/" className="hdr-logo">
          <span className="hdr-logo-icon">
            <Dumbbell size={18} strokeWidth={2.5} />
          </span>
          <span className="hdr-logo-text">Workout Partner</span>
        </Link>

        {isAuthenticated && (
          <div ref={containerRef} className="hdr-nav">
            {activeTab && (
              <span className="hdr-nav-indicator" style={{ left: ind.left, width: ind.width }} />
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

        <div className="hdr-right">
          {isAuthenticated ? (
            <>
              {/* Bell */}
              <div className="hdr-bell-wrap" ref={bellRef}>
                <button
                  className="hdr-bell"
                  aria-label="Notifications"
                  onClick={openBell}
                  aria-expanded={bellOpen}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="hdr-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>

                {bellOpen && (
                  <div className="hdr-notif-dropdown">
                    <div className="hdr-notif-head">
                      <span className="hdr-notif-title">Notifications</span>
                      {unreadCount > 0 && (
                        <button className="hdr-notif-markall" onClick={handleMarkAll}>
                          <CheckCheck size={13} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="hdr-notif-list">
                      {notifications.length === 0 ? (
                        <div className="hdr-notif-empty">
                          <Bell size={28} strokeWidth={1.5} />
                          <span>No notifications yet</span>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const Icon = NOTIF_ICONS[n.type] || Bell;
                          return (
                            <button
                              key={n.id}
                              className={`hdr-notif-item${n.is_read ? '' : ' hdr-notif-item--unread'}`}
                              onClick={() => handleNotifClick(n)}
                            >
                              <span className="hdr-notif-icon-wrap">
                                <Icon size={15} strokeWidth={2} />
                              </span>
                              <div className="hdr-notif-body">
                                <div className="hdr-notif-item-title">{n.title}</div>
                                <div className="hdr-notif-item-msg">{n.message}</div>
                                <div className="hdr-notif-item-time">{timeAgo(n.created_at)}</div>
                              </div>
                              {!n.is_read && <span className="hdr-notif-unread-dot" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="hdr-user-cluster" ref={userMenuRef}>
                <button
                  className="hdr-user-btn"
                  onClick={() => { setUserMenuOpen(v => !v); setBellOpen(false); }}
                  aria-expanded={userMenuOpen}
                >
                  <div className="hdr-avatar">{initials}</div>
                  <div className="hdr-user-info">
                    <span className="hdr-user-name">{displayName}</span>
                    {role && <span className="hdr-role-chip">{role}</span>}
                  </div>
                  <ChevronDown size={14} className={`hdr-chevron${userMenuOpen ? ' hdr-chevron--open' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="hdr-user-dropdown">
                    <button
                      className="hdr-dropdown-item hdr-dropdown-item--danger"
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                    >
                      <LogOut size={15} strokeWidth={2} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={login} className="hdr-login">Login</button>
          )}

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
            <button
              className="hdr-mobile-logout"
              onClick={() => { setMobileOpen(false); logout(); }}
            >
              <LogOut size={15} strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
