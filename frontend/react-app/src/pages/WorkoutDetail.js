import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workoutApi } from '../api';
import './WorkoutDetail.css';

const WorkoutDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    workoutApi.getSessionById(id)
      .then(res => setSession(res.data?.session || res.data))
      .catch(() => setError('Workout not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await workoutApi.deleteSession(id);
      navigate('/workouts');
    } catch {
      alert('Delete failed.');
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!session) return null;

  const exercises = session.exercises || [];

  return (
    <div className="page-container">
      <div className="detail-header">
        <div>
          <Link to="/workouts" className="back-link">← Back to workouts</Link>
          <h1>{session.title}</h1>
          <div className="detail-badges">
            <span className="badge badge-blue">{session.workout_type}</span>
            {session.is_public && <span className="badge badge-green">Public</span>}
          </div>
        </div>
        <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
      </div>

      <div className="detail-meta card">
        <div className="meta-item">
          <span className="meta-label">Duration</span>
          <span className="meta-value">{session.duration_minutes ?? '—'} min</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Calories</span>
          <span className="meta-value">{session.total_calories ? Math.round(session.total_calories) : '—'} kcal</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Date</span>
          <span className="meta-value">{session.started_at ? new Date(session.started_at).toLocaleDateString() : '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Exercises</span>
          <span className="meta-value">{exercises.length}</span>
        </div>
      </div>

      {session.notes && (
        <div className="card notes-card">
          <strong>Notes</strong>
          <p>{session.notes}</p>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="card">
          <h2>Exercises</h2>
          <table className="exercise-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Weight (kg)</th>
                <th>Duration (sec)</th>
                <th>Calories</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex, i) => (
                <tr key={ex.id || i}>
                  <td><strong>{ex.exercise_name}</strong></td>
                  <td>{ex.sets ?? '—'}</td>
                  <td>{ex.reps ?? '—'}</td>
                  <td>{ex.weight_kg ?? '—'}</td>
                  <td>{ex.duration_sec ?? '—'}</td>
                  <td>{ex.calories ? Math.round(ex.calories) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkoutDetail;
