import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workoutApi } from '../api';
import './WorkoutLog.css';

const PartnerWorkouts = () => {
  const { userId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    workoutApi.getPartnerSessions(userId)
      .then(res => setSessions(res.data?.sessions || res.data || []))
      .catch(() => setError('Failed to load partner workouts.'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Partner Workouts</h1>
        <div className="header-links">
          <Link to={`/chat/${userId}`} className="btn btn-primary">Chat</Link>
          <Link to="/partners" className="btn btn-secondary">← Partners</Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {sessions.length === 0 ? (
        <div className="card empty-state"><p>No public workouts yet.</p></div>
      ) : (
        <div className="session-cards">
          {sessions.map(s => (
            <div key={s.id} className="session-card card">
              <div className="session-card-top">
                <div>
                  <span className="session-title">{s.title}</span>
                  <span className="badge badge-blue">{s.workout_type}</span>
                </div>
              </div>
              <div className="session-card-meta">
                {s.duration_minutes && <span>{s.duration_minutes} min</span>}
                {s.total_calories && <span>{Math.round(s.total_calories)} kcal</span>}
                {s.started_at && <span>{new Date(s.started_at).toLocaleDateString()}</span>}
              </div>
              {s.notes && <p className="session-notes">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerWorkouts;
