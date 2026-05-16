import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workoutApi, matchApi } from '../api';
import {
  Dumbbell, Flame, Clock, Users, TrendingUp, Plus,
  Calendar, Repeat, ChevronRight, MessageCircle, Sparkles,
} from 'lucide-react';
import './Dashboard.css';

const MUSCLE_GROUP_COLORS = {
  chest:        { bg: '#FEE2E2', fg: '#9F1239', dot: '#E11D48' },
  back:         { bg: '#DBEAFE', fg: '#1E40AF', dot: '#2563EB' },
  legs:         { bg: '#FEF3C7', fg: '#92400E', dot: '#D97706' },
  shoulders:    { bg: '#EDE9FE', fg: '#5B21B6', dot: '#7C3AED' },
  arms:         { bg: '#FCE7F3', fg: '#9D174D', dot: '#DB2777' },
  core:         { bg: '#D1FAE5', fg: '#065F46', dot: '#059669' },
  cardio:       { bg: '#E0F2FE', fg: '#0369A1', dot: '#0284C7' },
  'full body':  { bg: '#FFF7ED', fg: '#9A3412', dot: '#EA580C' },
  default:      { bg: '#F3F4F6', fg: '#374151', dot: '#6B7280' },
};

function muscleGroupColor(muscleGroup) {
  const key = (muscleGroup || '').toLowerCase().trim();
  return MUSCLE_GROUP_COLORS[key] || MUSCLE_GROUP_COLORS.default;
}

function muscleGroupLabel(muscleGroup) {
  if (!muscleGroup) return null;
  const labels = { 'full body': 'Full Body', core: 'Core / Abs' };
  return labels[muscleGroup.toLowerCase()] || (muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1));
}

function StatCard({ icon: Icon, label, value, delta }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={20} strokeWidth={2.25} />
        </div>
        <TrendingUp size={16} className="stat-trending" />
      </div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-delta">{delta}</div>
    </div>
  );
}

function WorkoutEmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Dumbbell size={28} strokeWidth={2} />
      </div>
      <h3 className="empty-title">No workouts yet</h3>
      <p className="empty-subtitle">Start logging your first session to track progress.</p>
      <Link to="/workouts/new" className="empty-cta">
        <Plus size={16} strokeWidth={2.5} />
        Log a workout
      </Link>
    </div>
  );
}

function PartnerEmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Users size={28} strokeWidth={2} />
      </div>
      <h3 className="empty-title">No partners yet</h3>
      <p className="empty-subtitle">Find your perfect workout match based on goals and schedule.</p>
      <Link to="/partners/match" className="empty-cta">
        <Sparkles size={16} strokeWidth={2.5} />
        Find a match
      </Link>
    </div>
  );
}

function WorkoutRow({ session }) {
  const tagKey = session.muscle_group || null;
  const tone = muscleGroupColor(tagKey);
  const tagLabel = tagKey ? muscleGroupLabel(tagKey) : null;
  const date = session.started_at
    ? new Date(session.started_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    : '';
  return (
    <Link to={`/workouts/${session.id}`} className="workout-row">
      <div className="workout-row-icon">
        <Dumbbell size={18} strokeWidth={2.25} />
      </div>
      <div className="workout-row-body">
        <div className="workout-row-title-line">
          <span className="workout-row-title">{session.title}</span>
          {tagLabel && (
            <span className="workout-tag" style={{ background: tone.bg, color: tone.fg }}>
              <span className="workout-tag-dot" style={{ background: tone.dot }} />
              {tagLabel}
            </span>
          )}
        </div>
        <div className="workout-row-meta">
          {date && (
            <span><Calendar size={12} /> {date}</span>
          )}
          {session.duration_minutes && (
            <span><Repeat size={12} /> {session.duration_minutes} min</span>
          )}
          {session.total_calories && (
            <span className="workout-row-kcal">
              <Flame size={12} /> {Math.round(session.total_calories)} kcal
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="workout-row-chevron" />
    </Link>
  );
}

function PartnerRow({ partner }) {
  const initials = (partner.username || partner.first_name || '?').slice(0, 2).toUpperCase();
  return (
    <div className="partner-row">
      <div className="partner-avatar">{initials}</div>
      <div className="partner-body">
        <div className="partner-name-line">
          <span className="partner-name">{partner.username || `${partner.first_name} ${partner.last_name}`.trim()}</span>
        </div>
        <div className="partner-level-tag">{partner.fitness_level || 'Athlete'}</div>
      </div>
      <div className="partner-actions">
        <Link to={`/chat/${partner.id}`} className="partner-msg-btn">
          <MessageCircle size={14} strokeWidth={2.25} />
          Message
        </Link>
        <Link to={`/workouts/partner/${partner.id}`} className="partner-workouts-btn">Workouts</Link>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.firstName || user?.username || 'there';

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, sessionsRes, partnersRes] = await Promise.all([
          workoutApi.getMyStats(),
          workoutApi.getSessions({ limit: 5 }),
          matchApi.getPartners(),
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

  const statCards = [
    { icon: Dumbbell, label: 'Total Sessions',  value: stats?.total_sessions ?? 0,                        delta: 'All time' },
    { icon: Flame,    label: 'Calories Burned',  value: stats?.total_calories ? Math.round(stats.total_calories).toLocaleString() : 0, delta: 'All time' },
    { icon: Clock,    label: 'Minutes Trained',  value: stats?.total_duration_minutes ? Number(stats.total_duration_minutes).toLocaleString() : 0, delta: `~${stats?.avg_session_duration ?? 0} min / session` },
    { icon: Users,    label: 'Active Partners',  value: partners.length,                                    delta: 'Connected' },
  ];

  return (
    <div className="db-page">
      {/* Page header */}
      <div className="db-header">
        <div>
          <div className="db-header-eyebrow">Dashboard</div>
          <h1 className="db-header-title">{greeting}, {firstName}.</h1>
          <p className="db-header-sub">Here's your training snapshot.</p>
        </div>
        <div className="db-header-actions">
          <Link to="/workouts/new" className="db-log-btn">
            <Plus size={15} strokeWidth={2.5} />
            Log workout
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Main content */}
      <div className="db-grid">
        {/* Recent Workouts */}
        <section className="db-card">
          <div className="db-card-header">
            <div>
              <h2 className="db-card-title">Recent Workouts</h2>
              <p className="db-card-sub">Your last sessions</p>
            </div>
            {recentSessions.length > 0 && (
              <Link to="/workouts" className="db-card-link">View all</Link>
            )}
          </div>
          {recentSessions.length === 0 ? (
            <WorkoutEmptyState />
          ) : (
            <div className="db-card-list">
              {recentSessions.map(s => <WorkoutRow key={s.id} session={s} />)}
            </div>
          )}
        </section>

        {/* Partners */}
        <section className="db-card">
          <div className="db-card-header">
            <div>
              <h2 className="db-card-title">My Partners</h2>
              <p className="db-card-sub">Athletes matched with you</p>
            </div>
            {partners.length > 0 && (
              <Link to="/partners/find" className="db-card-link">Find more</Link>
            )}
          </div>
          {partners.length === 0 ? (
            <PartnerEmptyState />
          ) : (
            <div className="db-card-list">
              {partners.slice(0, 5).map(p => <PartnerRow key={p.id} partner={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
