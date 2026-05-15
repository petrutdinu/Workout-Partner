import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workoutApi, matchApi } from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, sessionsRes, partnersRes] = await Promise.all([
          workoutApi.getMyStats(),
          workoutApi.getSessions({ limit: 5 }),
          matchApi.getPartners()
        ]);
        setStats(statsRes.data);
        setRecentSessions(sessionsRes.data?.sessions || sessionsRes.data || []);
        setPartners(partnersRes.data?.partners || partnersRes.data || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName || user?.username}!</h1>
        <Link to="/workouts/new" className="btn btn-primary">+ Log Workout</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats?.total_sessions ?? 0}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.total_calories ? Math.round(stats.total_calories) : 0}</div>
          <div className="stat-label">Total Calories</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.total_duration_minutes ?? 0}</div>
          <div className="stat-label">Minutes Trained</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{partners.length}</div>
          <div className="stat-label">Partners</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-header">
            <h2>Recent Workouts</h2>
            <Link to="/workouts" className="link-more">View all</Link>
          </div>
          {recentSessions.length === 0 ? (
            <p className="empty-state">No workouts yet. <Link to="/workouts/new">Log your first one!</Link></p>
          ) : (
            <div className="session-list">
              {recentSessions.map(s => (
                <Link to={`/workouts/${s.id}`} key={s.id} className="session-row">
                  <div>
                    <strong>{s.title}</strong>
                    <span className="session-type">{s.workout_type}</span>
                  </div>
                  <div className="session-meta">
                    <span>{s.duration_minutes} min</span>
                    {s.total_calories && <span>{Math.round(s.total_calories)} kcal</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <h2>My Partners</h2>
            <Link to="/partners/find" className="link-more">Find more</Link>
          </div>
          {partners.length === 0 ? (
            <p className="empty-state">No partners yet. <Link to="/partners/match">Find your match!</Link></p>
          ) : (
            <div className="partner-list">
              {partners.slice(0, 5).map(p => (
                <div key={p.id} className="partner-row">
                  <div className="partner-info">
                    <strong>{p.username}</strong>
                    <span className="partner-level">{p.fitness_level || 'Beginner'}</span>
                  </div>
                  <div className="partner-actions">
                    <Link to={`/chat/${p.id}`} className="btn btn-secondary btn-sm">Chat</Link>
                    <Link to={`/workouts/partner/${p.id}`} className="btn btn-secondary btn-sm">Workouts</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
