import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchApi } from '../api';
import { MessageCircle, Users, Sparkles } from 'lucide-react';
import './ChatList.css';

const ACCENT = '#DC2626';

const AVATAR_TONES = [
  '#0EA5E9', '#7C3AED', '#10B981', '#EA580C', '#EC4899', '#F97316', '#DC2626',
];

function getAvatarTone(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

const ChatList = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matchApi.getPartners()
      .then(res => setPartners(res.data?.partners || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="cl-loading">Loading…</div>;

  return (
    <div className="cl-page">
      <div className="cl-header">
        <h1 className="cl-title">
          <span className="cl-title-icon" style={{ background: ACCENT }}>
            <MessageCircle size={22} strokeWidth={2.5} />
          </span>
          Messages
        </h1>
        <p className="cl-subtitle">Chat with your workout partners.</p>
      </div>

      {partners.length === 0 ? (
        <div className="cl-empty">
          <div className="cl-empty-icon-wrap">
            <span className="cl-empty-glow" />
            <div className="cl-empty-icon" style={{ background: ACCENT + '14', color: ACCENT }}>
              <Users size={42} strokeWidth={1.75} />
            </div>
          </div>
          <h3 className="cl-empty-title">No partners yet</h3>
          <p className="cl-empty-sub">Connect with athletes to start chatting.</p>
          <Link to="/partners/find" className="cl-empty-cta" style={{ background: ACCENT, boxShadow: `0 8px 20px -6px ${ACCENT}80` }}>
            <Sparkles size={15} strokeWidth={2.5} />
            Find Partners
          </Link>
        </div>
      ) : (
        <div className="cl-list">
          {partners.map((p, i) => {
            const name = p.username || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Partner';
            const initials = name.slice(0, 2).toUpperCase();
            const tone = getAvatarTone(name);
            return (
              <Link
                key={p.id}
                to={`/chat/${p.id}`}
                className="cl-row"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className="cl-avatar"
                  style={{ background: `linear-gradient(135deg, ${tone}, ${tone}cc)` }}
                >
                  {initials}
                </div>
                <div className="cl-row-body">
                  <span className="cl-row-name">{name}</span>
                  {p.fitness_level && <span className="cl-row-level">{p.fitness_level}</span>}
                </div>
                <MessageCircle size={16} className="cl-row-icon" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;
