import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workoutApi } from '../api';
import './WorkoutLog.css';

const WorkoutLog = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 10;

  const fetchSessions = async (p = 1) => {
    setLoading(true);
    try {
      const res = await workoutApi.getSessions({ skip: (p - 1) * PAGE_SIZE, limit: PAGE_SIZE });
      const data = res.data?.sessions || res.data || [];
      if (p === 1) setSessions(data);
      else setSessions(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError('Failed to load workouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(1); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await workoutApi.deleteSession(id);
      setSessions(s => s.filter(x => x.id !== id));
    } catch {
      alert('Delete failed.');
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchSessions(next);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Workouts</h1>
        <Link to="/workouts/new" className="btn btn-primary">+ New Session</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && sessions.length === 0 ? (
        <div className="loading-screen">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="card empty-state">
          <p>No workouts logged yet.</p>
          <Link to="/workouts/new" className="btn btn-primary">Log your first workout</Link>
        </div>
      ) : (
        <div className="session-cards">
          {sessions.map(s => (
            <div key={s.id} className="session-card card">
              <div className="session-card-top">
                <div>
                  <Link to={`/workouts/${s.id}`} className="session-title">{s.title}</Link>
                  <span className="badge badge-blue">{s.workout_type}</span>
                  {s.is_public && <span className="badge badge-green">Public</span>}
                </div>
                <button className="btn-delete" onClick={() => handleDelete(s.id)}>Delete</button>
              </div>
              <div className="session-card-meta">
                {s.duration_minutes && <span>{s.duration_minutes} min</span>}
                {s.total_calories && <span>{Math.round(s.total_calories)} kcal</span>}
                {s.started_at && <span>{new Date(s.started_at).toLocaleDateString()}</span>}
              </div>
              {s.notes && <p className="session-notes">{s.notes}</p>}
            </div>
          ))}
          {hasMore && (
            <button className="btn btn-secondary" onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutLog;
