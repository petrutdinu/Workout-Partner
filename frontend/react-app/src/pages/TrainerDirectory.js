import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi, matchApi } from '../api';
import './TrainerDirectory.css';

const TrainerDirectory = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    userApi.getTrainers()
      .then(res => setTrainers(res.data?.trainers || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sendRequest = async (id) => {
    try {
      await matchApi.sendRequest(id);
      setSentRequests(s => new Set([...s, id]));
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('already')) setSentRequests(s => new Set([...s, id]));
      else alert('Failed to send request.');
    }
  };

  const filtered = cityFilter
    ? trainers.filter(t => t.city?.toLowerCase().includes(cityFilter.toLowerCase()))
    : trainers;

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Trainers</h1>
        <input
          style={{ maxWidth: 200 }}
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          placeholder="Filter by city..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state"><p>No trainers found.</p></div>
      ) : (
        <div className="trainer-grid">
          {filtered.map(t => (
            <div key={t.id} className="trainer-card card">
              <div className="trainer-top">
                <div className="trainer-avatar">{(t.username || 'T')[0].toUpperCase()}</div>
                <div>
                  <h3>{t.username}</h3>
                  <p className="trainer-city">{t.city || 'Location unknown'}</p>
                </div>
                {t.hourly_rate && (
                  <div className="trainer-rate">€{t.hourly_rate}<span>/hr</span></div>
                )}
              </div>
              {t.bio && <p className="trainer-bio">{t.bio.slice(0, 120)}{t.bio.length > 120 ? '...' : ''}</p>}
              {t.certifications?.length > 0 && (
                <div className="trainer-certs">
                  {t.certifications.map(c => <span key={c} className="badge badge-purple">{c}</span>)}
                </div>
              )}
              <div className="trainer-badges">
                {t.fitness_level && <span className="badge badge-blue">{t.fitness_level}</span>}
                {t.workout_types?.slice(0, 3).map(wt => <span key={wt} className="badge badge-gray">{wt}</span>)}
              </div>
              <div className="trainer-actions">
                <button
                  className={`btn ${sentRequests.has(t.id) ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={sentRequests.has(t.id)}
                  onClick={() => sendRequest(t.id)}>
                  {sentRequests.has(t.id) ? 'Request Sent' : 'Request Training'}
                </button>
                <Link to={`/chat/${t.id}`} className="btn btn-secondary">Message</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerDirectory;
