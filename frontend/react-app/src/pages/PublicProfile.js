import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, matchApi } from '../api';
import {
  ArrowLeft, MapPin, Target, Activity, Dumbbell, Calendar,
  MessageCircle, UserPlus, Clock, Flame, AlertCircle, Lock,
  ExternalLink,
} from 'lucide-react';
import './PublicProfile.css';

const ACCENT = '#DC2626';

const LEVEL_TONES = {
  Beginner:     { bg: '#DCFCE7', fg: '#15803D', dot: '#22C55E' },
  Intermediate: { bg: '#DBEAFE', fg: '#1E40AF', dot: '#3B82F6' },
  Advanced:     { bg: '#FCE7F3', fg: '#9D174D', dot: '#DB2777' },
  Elite:        { bg: '#EDE9FE', fg: '#5B21B6', dot: '#7C3AED' },
};

const AVATAR_TONES = [
  '#0EA5E9', '#7C3AED', '#10B981', '#EA580C', '#EC4899', '#F97316', '#DC2626',
];

function getAvatarTone(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function Avatar({ name, size = 72 }) {
  const initials = (name || 'U').slice(0, 2).toUpperCase();
  const tone = getAvatarTone(name || 'U');
  return (
    <div
      className="pp-avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${tone}, ${tone}cc)`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}

function LevelBadge({ level }) {
  const t = LEVEL_TONES[level] || LEVEL_TONES.Intermediate;
  return (
    <span className="pp-level-badge" style={{ background: t.bg, color: t.fg }}>
      <span className="pp-level-dot" style={{ background: t.dot }} />
      {level}
    </span>
  );
}

function formatGoal(goal) {
  return (goal || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 86400) return 'Today';
  if (diff < 172800) return 'Yesterday';
  const d = Math.floor(diff / 86400);
  return `${d}d ago`;
}

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userApi.getPublicProfile(userId);
        setData(res.data);
        setConnectionStatus(res.data.connectionStatus);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('not_found');
        } else {
          setError('generic');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await matchApi.sendRequest(userId);
      setConnectionStatus('pending_sent');
    } catch (err) {
      if (err.response?.data?.message?.includes('already') || err.response?.status === 409) {
        setConnectionStatus('pending_sent');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">Loading profile…</div>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="pp-page">
        <div className="pp-error">
          <div className="pp-error-icon">
            <AlertCircle size={28} />
          </div>
          <h2 className="pp-error-title">Profile not found</h2>
          <p className="pp-error-sub">This user doesn't exist or has been removed.</p>
          <button className="pp-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-page">
        <div className="pp-error">
          <div className="pp-error-icon">
            <AlertCircle size={28} />
          </div>
          <h2 className="pp-error-title">Something went wrong</h2>
          <p className="pp-error-sub">Could not load this profile. Please try again.</p>
          <button className="pp-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, workouts } = data;
  const isSelf = connectionStatus === 'self';
  const isAccepted = connectionStatus === 'accepted';
  const isPendingSent = connectionStatus === 'pending_sent';
  const isPendingReceived = connectionStatus === 'pending_received';
  const isNone = connectionStatus === 'none';

  const name = user.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    : user.username || 'Athlete';

  const totalSessions = parseInt(stats?.total_sessions) || 0;
  const totalCal = Math.round(parseFloat(stats?.total_calories) || 0);
  const totalMin = parseInt(stats?.total_duration_minutes) || 0;
  const avgMin = Math.round(parseFloat(stats?.avg_session_duration) || 0);

  return (
    <div className="pp-page">
      {/* Back navigation */}
      <button className="pp-back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Hero card */}
      <div className="pp-hero">
        <div className="pp-hero-top">
          <Avatar name={name} size={72} />
          <div className="pp-hero-info">
            <h1 className="pp-hero-name">{name}</h1>
            <div className="pp-hero-meta">
              {user.city && (
                <span className="pp-meta-item">
                  <MapPin size={13} />
                  {user.city}
                </span>
              )}
              {user.fitness_level && <LevelBadge level={user.fitness_level} />}
              {user.primary_goal && (
                <span className="pp-goal-tag">
                  <Target size={11} style={{ marginRight: 3 }} />
                  {formatGoal(user.primary_goal)}
                </span>
              )}
            </div>
            {(isAccepted || isSelf) && user.bio && (
              <p className="pp-bio">{user.bio}</p>
            )}
            {!isAccepted && !isSelf && user.bio && (
              <p className="pp-bio">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pp-hero-actions">
          {isSelf && (
            <Link to="/profile" className="pp-btn pp-btn--outline">
              <Activity size={14} />
              Edit profile
            </Link>
          )}

          {isNone && (
            <button
              className="pp-btn pp-btn--primary"
              style={{ background: ACCENT, boxShadow: `0 6px 16px -6px ${ACCENT}99` }}
              onClick={handleSendRequest}
              disabled={actionLoading}
            >
              <UserPlus size={14} />
              {actionLoading ? 'Sending…' : 'Send partner request'}
            </button>
          )}

          {isPendingSent && (
            <button className="pp-btn pp-btn--outline" disabled>
              <Clock size={14} />
              Request pending
            </button>
          )}

          {isPendingReceived && (
            <Link to="/partners" className="pp-btn pp-btn--primary" style={{ background: ACCENT }}>
              <UserPlus size={14} />
              Respond to request
            </Link>
          )}

          {isAccepted && (
            <>
              <Link to={`/chat/${userId}`} className="pp-btn pp-btn--message">
                <MessageCircle size={14} />
                Message
              </Link>
              {workouts?.length > 0 && (
                <Link to={`/workouts/partner/${userId}`} className="pp-btn pp-btn--outline">
                  <Dumbbell size={14} />
                  View workouts
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Privacy gate banners */}
      {isNone && (
        <div className="pp-gate pp-gate--none">
          <Lock size={18} className="pp-gate-icon pp-gate-icon--none" />
          <div className="pp-gate-body">
            <div className="pp-gate-title">Limited view</div>
            <div className="pp-gate-msg">
              Connect as partners to view full profile, workout stats and recent workouts.
            </div>
          </div>
        </div>
      )}

      {(isPendingSent || isPendingReceived) && (
        <div className="pp-gate pp-gate--pending">
          <Clock size={18} className="pp-gate-icon pp-gate-icon--pending" />
          <div className="pp-gate-body">
            <div className="pp-gate-title">
              {isPendingSent ? 'Request sent' : 'Incoming request'}
            </div>
            <div className="pp-gate-msg">
              {isPendingSent
                ? 'Partner request pending. Full profile unlocks after acceptance.'
                : 'This person sent you a partner request. Accept it to unlock the full profile.'}
            </div>
          </div>
        </div>
      )}

      {/* Full profile content — accepted + self only */}
      {(isAccepted || isSelf) && (
        <>
          {/* Stats */}
          {stats && (
            <div className="pp-section">
              <h2 className="pp-section-title">Workout Stats</h2>
              <div className="pp-stats-grid">
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{totalSessions}</div>
                  <div className="pp-stat-label">Sessions</div>
                </div>
                <div className="pp-stat-card">
                  <div className="pp-stat-value" style={{ color: ACCENT }}>{totalCal.toLocaleString()}</div>
                  <div className="pp-stat-label">Calories</div>
                </div>
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{totalMin}</div>
                  <div className="pp-stat-label">Minutes</div>
                </div>
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{avgMin}</div>
                  <div className="pp-stat-label">Avg min</div>
                </div>
              </div>
            </div>
          )}

          {/* Preferred days */}
          {user.preferred_days?.length > 0 && (
            <div className="pp-section">
              <h2 className="pp-section-title">Preferred Training Days</h2>
              <div className="pp-days">
                {user.preferred_days.map(d => (
                  <span key={d} className="pp-day-pill">{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* Workout types */}
          {user.workout_types?.length > 0 && (
            <div className="pp-section">
              <h2 className="pp-section-title">Workout Types</h2>
              <div className="pp-workout-types">
                {user.workout_types.map(t => (
                  <span key={t} className="pp-wtype-pill">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recent public workouts */}
          <div className="pp-section">
            <h2 className="pp-section-title">Recent Workouts</h2>
            {!workouts || workouts.length === 0 ? (
              <div className="pp-workout-empty">No public workouts yet.</div>
            ) : (
              <>
                <div className="pp-workout-list">
                  {workouts.slice(0, 5).map(w => (
                    <div key={w.id} className="pp-workout-item">
                      <div className="pp-workout-icon">
                        <Dumbbell size={16} strokeWidth={2} />
                      </div>
                      <div className="pp-workout-info">
                        <div className="pp-workout-title">{w.title || 'Workout'}</div>
                        <div className="pp-workout-meta">
                          {w.workout_type && <span>{w.workout_type}</span>}
                          {w.duration_minutes && <span> · {w.duration_minutes} min</span>}
                          {w.started_at && <span> · {timeAgo(w.started_at)}</span>}
                        </div>
                      </div>
                      {w.total_calories > 0 && (
                        <div className="pp-workout-cal">
                          <Flame size={12} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                          {Math.round(w.total_calories)} kcal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {workouts.length > 5 && (
                  <Link to={`/workouts/partner/${userId}`} className="pp-view-all-btn">
                    <ExternalLink size={13} />
                    View all {workouts.length} workouts
                  </Link>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PublicProfile;
