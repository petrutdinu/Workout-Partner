import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchApi } from '../api';
import './PartnerList.css';

const PartnerList = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted');

  useEffect(() => {
    matchApi.getConnections()
      .then(res => setConnections(res.data?.connections || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await matchApi.updateConnection(id, status);
      setConnections(cs => cs.map(c => c.id === id ? {...c, status} : c));
    } catch {
      alert('Update failed.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this connection?')) return;
    try {
      await matchApi.removeConnection(id);
      setConnections(cs => cs.filter(c => c.id !== id));
    } catch {
      alert('Remove failed.');
    }
  };

  const tabs = {
    accepted: connections.filter(c => c.status === 'accepted'),
    pending: connections.filter(c => c.status === 'pending'),
    sent: connections.filter(c => c.status === 'pending' && c.is_requester)
  };

  const displayed = connections.filter(c => {
    if (activeTab === 'accepted') return c.status === 'accepted';
    if (activeTab === 'pending') return c.status === 'pending' && !c.is_requester;
    if (activeTab === 'sent') return c.status === 'pending' && c.is_requester;
    return false;
  });

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Partners</h1>
        <div className="header-links">
          <Link to="/partners/find" className="btn btn-secondary">Browse Athletes</Link>
          <Link to="/partners/match" className="btn btn-primary">AI Match</Link>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'accepted' ? 'active' : ''}`} onClick={() => setActiveTab('accepted')}>
          Partners ({connections.filter(c => c.status === 'accepted').length})
        </button>
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Incoming ({connections.filter(c => c.status === 'pending' && !c.is_requester).length})
        </button>
        <button className={`tab ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
          Sent ({connections.filter(c => c.status === 'pending' && c.is_requester).length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="card empty-state"><p>Nothing here yet.</p></div>
      ) : (
        <div className="connection-list">
          {displayed.map(c => {
            const other = c.is_requester ? c.addressee : c.requester;
            return (
              <div key={c.id} className="connection-card card">
                <div className="conn-avatar">{(other?.username || 'U')[0].toUpperCase()}</div>
                <div className="conn-info">
                  <h3>{other?.username || 'Unknown'}</h3>
                  <p>{other?.city || ''} {other?.fitness_level ? `· ${other.fitness_level}` : ''}</p>
                  {c.match_score && (
                    <span className="badge badge-green">{Math.round(c.match_score * 100)}% match</span>
                  )}
                </div>
                <div className="conn-actions">
                  {activeTab === 'accepted' && (
                    <>
                      <Link to={`/chat/${other?.id}`} className="btn btn-primary btn-sm">Chat</Link>
                      <Link to={`/workouts/partner/${other?.id}`} className="btn btn-secondary btn-sm">Workouts</Link>
                      <button className="btn btn-secondary btn-sm" onClick={() => remove(c.id)}>Remove</button>
                    </>
                  )}
                  {activeTab === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => updateStatus(c.id, 'accepted')}>Accept</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(c.id, 'declined')}>Decline</button>
                    </>
                  )}
                  {activeTab === 'sent' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => remove(c.id)}>Cancel</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnerList;
