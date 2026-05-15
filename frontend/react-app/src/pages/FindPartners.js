import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi, matchApi } from '../api';
import './FindPartners.css';

const FITNESS_LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];
const GOALS = ['', 'weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'];

const FindPartners = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ fitness_level: '', primary_goal: '', city: '' });
  const [sentRequests, setSentRequests] = useState(new Set());

  const fetchAthletes = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await userApi.getAthletes(params);
      setAthletes(res.data?.athletes || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAthletes(); }, []);

  const sendRequest = async (userId) => {
    try {
      await matchApi.sendRequest(userId);
      setSentRequests(s => new Set([...s, userId]));
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('already')) {
        setSentRequests(s => new Set([...s, userId]));
      } else {
        alert('Failed to send request.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Find Partners</h1>
        <Link to="/partners/match" className="btn btn-primary">AI Smart Match</Link>
      </div>

      <div className="filter-bar card">
        <div className="filter-row">
          <div className="form-group">
            <label>Fitness Level</label>
            <select value={filters.fitness_level} onChange={e => setFilters(f => ({...f, fitness_level: e.target.value}))}>
              {FITNESS_LEVELS.map(l => <option key={l} value={l}>{l || 'Any'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Goal</label>
            <select value={filters.primary_goal} onChange={e => setFilters(f => ({...f, primary_goal: e.target.value}))}>
              {GOALS.map(g => <option key={g} value={g}>{g ? g.replace('_', ' ') : 'Any'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>City</label>
            <input value={filters.city} onChange={e => setFilters(f => ({...f, city: e.target.value}))} placeholder="Any city" />
          </div>
          <button className="btn btn-primary" onClick={fetchAthletes}>Search</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen">Searching...</div>
      ) : athletes.length === 0 ? (
        <div className="card empty-state"><p>No athletes found matching your criteria.</p></div>
      ) : (
        <div className="athlete-grid">
          {athletes.map(a => (
            <div key={a.id} className="athlete-card card">
              <div className="athlete-header">
                <div className="athlete-avatar">{(a.username || 'U')[0].toUpperCase()}</div>
                <div>
                  <h3>{a.username}</h3>
                  <p className="athlete-city">{a.city || 'Unknown city'}</p>
                </div>
              </div>
              <div className="athlete-badges">
                {a.fitness_level && <span className="badge badge-blue">{a.fitness_level}</span>}
                {a.primary_goal && <span className="badge badge-orange">{a.primary_goal.replace('_', ' ')}</span>}
              </div>
              {a.bio && <p className="athlete-bio">{a.bio.slice(0, 100)}{a.bio.length > 100 ? '...' : ''}</p>}
              {a.workout_types?.length > 0 && (
                <div className="athlete-types">
                  {a.workout_types.slice(0, 4).map(t => <span key={t} className="type-tag">{t}</span>)}
                </div>
              )}
              <div className="athlete-actions">
                <button
                  className={`btn ${sentRequests.has(a.id) ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={sentRequests.has(a.id)}
                  onClick={() => sendRequest(a.id)}>
                  {sentRequests.has(a.id) ? 'Request Sent' : 'Connect'}
                </button>
                <Link to={`/chat/${a.id}`} className="btn btn-secondary">Message</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindPartners;
