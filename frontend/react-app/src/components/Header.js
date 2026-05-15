import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, isAdmin, isTrainer, login, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="header">
      <div className="header-brand">
        <Link to="/">
          <h1>Workout Partner</h1>
        </Link>
      </div>

      <nav className="header-nav">
        {isAuthenticated && (
          <>
            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link>
            <Link to="/workouts" className={isActive('/workouts') ? 'active' : ''}>Workouts</Link>
            <Link to="/partners" className={isActive('/partners') ? 'active' : ''}>Partners</Link>
            <Link to="/progress" className={isActive('/progress') ? 'active' : ''}>Progress</Link>
            <Link to="/gyms" className={isActive('/gyms') ? 'active' : ''}>Gyms</Link>
            {isTrainer && (
              <Link to="/trainers" className={isActive('/trainers') ? 'active' : ''}>Trainers</Link>
            )}
          </>
        )}
      </nav>

      <div className="header-user">
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="user-info">
              {user?.firstName || user?.username}
              {isAdmin && <span className="role-badge admin">Admin</span>}
              {isTrainer && !isAdmin && <span className="role-badge trainer">Trainer</span>}
            </Link>
            <button onClick={logout} className="btn-logout">Logout</button>
          </>
        ) : (
          <button onClick={login} className="btn-login">Login</button>
        )}
      </div>
    </header>
  );
};

export default Header;
