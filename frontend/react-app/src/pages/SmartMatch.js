import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchApi } from '../api';
import './SmartMatch.css';

const scoreColor = (score) => {
  if (score >= 0.75) return '#43a047';
  if (score >= 0.5) return '#fb8c00';
  return '#e53935';
};

const SmartMatch = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await matchApi.getSuggestions();
      setSuggestions(res.data?.suggestions || res.data || []);
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('profile')) {
        setError('Complete your fitness profile first to use AI matching.');
      } else {
        setError('Failed to load suggestions.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuggestions(); }, []);

  const sendRequest = async (userId) => {
    try {
      await matchApi.sendRequest(userId);
      setSentRequests(s => new Set([...s, userId]));
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('already')) setSentRequests(s => new Set([...s, userId]));
      else alert('Failed to send request.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>AI Smart Match</h1>
          <p className="page-subtitle">Ranked by compatibility: fitness level, goals, schedule, and workout preferences.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSuggestions} disabled={loading}>Refresh</button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error} {error.includes('profile') && <Link to="/profile">Go to Profile</Link>}
        </div>
      )}

      {loading ? (
        <div className="loading-screen">Calculating matches...</div>
      ) : suggestions.length === 0 && !error ? (
        <div className="card empty-state">
          <p>No matches found. Make sure other athletes have completed their profiles.</p>
        </div>
      ) : (
        <div className="match-list">
          {suggestions.map((s, idx) => (
            <div key={s.id} className="match-card card">
              <div className="match-rank">#{idx + 1}</div>
              <div className="match-avatar">{(s.username || 'U')[0].toUpperCase()}</div>
              <div className="match-info">
                <h3>{s.username}</h3>
                <p className="match-city">{s.city || 'Unknown city'}</p>
                <div className="match-badges">
                  {s.fitness_level && <span className="badge badge-blue">{s.fitness_level}</span>}
                  {s.primary_goal && <span className="badge badge-orange">{s.primary_goal.replace('_', ' ')}</span>}
                  {s.preferred_time && <span className="badge badge-purple">{s.preferred_time}</span>}
                </div>
                {s.workout_types?.length > 0 && (
                  <div className="match-types">
                    {s.workout_types.slice(0, 5).map(t => <span key={t} className="type-tag">{t}</span>)}
                  </div>
                )}
              </div>
              <div className="match-score-section">
                <div className="score-circle" style={{ borderColor: scoreColor(s.match_score) }}>
                  <span className="score-value" style={{ color: scoreColor(s.match_score) }}>
                    {Math.round((s.match_score || 0) * 100)}%
                  </span>
                  <span className="score-label">match</span>
                </div>
                <div className="match-actions">
                  <button
                    className={`btn ${sentRequests.has(s.id) ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={sentRequests.has(s.id)}
                    onClick={() => sendRequest(s.id)}>
                    {sentRequests.has(s.id) ? 'Sent' : 'Connect'}
                  </button>
                  <Link to={`/profile/${s.id}`} className="btn btn-secondary">Profile</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartMatch;
