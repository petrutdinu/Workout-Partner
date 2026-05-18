import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { matchApi } from '../api';
import {
  Users, Search, Sparkles, MapPin, Clock, MessageCircle,
  UserCheck, Check, X, XCircle, Inbox, Send, UserPlus,
  TrendingUp, Target, Calendar, Heart, User,
} from 'lucide-react';
import './PartnerList.css';

const ACCENT = '#DC2626';

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const clamp = v => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

const LEVEL_TONES = {
  Beginner:     { bg: '#DCFCE7', fg: '#15803D', dot: '#22C55E' },
  Intermediate: { bg: '#DBEAFE', fg: '#1E40AF', dot: '#3B82F6' },
  Advanced:     { bg: '#FCE7F3', fg: '#9D174D', dot: '#DB2777' },
  Elite:        { bg: '#EDE9FE', fg: '#5B21B6', dot: '#7C3AED' },
};

const AVATAR_TONES = [
  '#0EA5E9', '#7C3AED', '#10B981', '#EA580C', '#EC4899', '#F97316',
];

function getAvatarTone(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

// ── Mode toggle (Browse / AI Match) ──────────────────────────────────────────
function ModeToggle({ mode, setMode }) {
  const wrapRef = useRef(null);
  const refs = useRef({});
  const [ind, setInd] = useState({ left: 4, width: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const el = refs.current[mode];
      if (!wrap || !el) return;
      const w = wrap.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (r.width < 20) return;
      setInd({ left: r.left - w.left, width: r.width });
    };
    measure();
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    Object.values(refs.current).forEach(el => el && ro.observe(el));
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf1); cancelAnimationFrame(raf2);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [mode]);

  return (
    <div ref={wrapRef} className="pl-mode-toggle">
      <span
        className="pl-mode-indicator"
        style={{
          left: ind.left,
          width: ind.width,
          background: mode === 'ai'
            ? `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})`
            : '#ffffff',
          boxShadow: mode === 'ai'
            ? `0 4px 14px -4px ${ACCENT}99`
            : '0 1px 3px rgba(0,0,0,0.08)',
        }}
      />
      <button
        ref={el => refs.current['browse'] = el}
        onClick={() => setMode('browse')}
        className="pl-mode-btn"
        style={{ color: mode === 'browse' ? '#111827' : '#6B7280' }}
      >
        <Search size={14} strokeWidth={2.25} />
        Browse Athletes
      </button>
      <button
        ref={el => refs.current['ai'] = el}
        onClick={() => setMode('ai')}
        className="pl-mode-btn"
        style={{ color: mode === 'ai' ? '#ffffff' : '#6B7280' }}
      >
        <Sparkles size={14} strokeWidth={2.25} />
        AI Match
      </button>
    </div>
  );
}

// ── Tab strip ─────────────────────────────────────────────────────────────────
function TabStrip({ activeTab, setActiveTab, counts }) {
  const tabs = [
    { id: 'accepted', label: 'Partners', Icon: Users,    count: counts.accepted },
    { id: 'pending',  label: 'Incoming', Icon: Inbox,    count: counts.pending },
    { id: 'sent',     label: 'Sent',     Icon: Send,     count: counts.sent },
  ];

  return (
    <div className="pl-tab-strip">
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pl-tab ${isActive ? 'pl-tab--active' : ''}`}
          >
            <t.Icon size={14} strokeWidth={2.25} />
            <span>{t.label}</span>
            {t.count > 0 && (
              <span
                className="pl-tab-badge"
                style={{
                  background: isActive ? ACCENT : '#E5E7EB',
                  color: isActive ? '#fff' : '#4B5563',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 56 }) {
  const initials = (name || 'U').slice(0, 2).toUpperCase();
  const tone = getAvatarTone(name || 'U');
  return (
    <div
      className="pl-avatar"
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
    <span className="pl-level-badge" style={{ background: t.bg, color: t.fg }}>
      <span className="pl-level-dot" style={{ background: t.dot }} />
      {level}
    </span>
  );
}

function MatchBar({ pct }) {
  return (
    <div className="pl-match-bar-wrap">
      <div className="pl-match-bar-labels">
        <span>Compatibility</span>
        <span style={{ color: ACCENT }}>{pct}% match</span>
      </div>
      <div className="pl-match-bar-track">
        <div
          className="pl-match-bar-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${ACCENT}, ${shade(ACCENT, 20)})`,
            boxShadow: `0 0 8px ${ACCENT}55`,
          }}
        />
      </div>
    </div>
  );
}

function GoalTags({ goals }) {
  if (!goals?.length) return null;
  return (
    <div className="pl-goal-tags">
      {goals.map(g => (
        <span key={g} className="pl-goal-tag" style={{ background: ACCENT + '12', color: ACCENT }}>
          {g}
        </span>
      ))}
    </div>
  );
}

// ── Partner card ──────────────────────────────────────────────────────────────
function PartnerCard({ connection, index, variant, onAccept, onDecline, onRemove }) {
  const navigate = useNavigate();
  const other = connection.is_requester ? connection.addressee : connection.requester;
  const name = other?.username || `${other?.first_name || ''} ${other?.last_name || ''}`.trim() || 'Unknown';
  const level = other?.fitness_level || null;
  const city = other?.city || null;
  const matchPct = connection.match_score ? Math.round(connection.match_score * 100) : null;
  const goals = other?.workout_types || [];

  return (
    <article
      className="pl-card"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <div className="pl-card-inner">
        <Avatar name={name} />
        <div className="pl-card-body">
          <div className="pl-card-header-row">
            <div className="pl-card-name-block">
              <h3 className="pl-card-name">{name}</h3>
              <div className="pl-card-meta">
                {city && (
                  <span className="pl-meta-item">
                    <MapPin size={12} className="pl-meta-icon" />
                    {city}
                  </span>
                )}
                {variant === 'incoming' && (
                  <span className="pl-meta-item">
                    <Clock size={12} className="pl-meta-icon" />
                    Incoming request
                  </span>
                )}
                {variant === 'sent' && (
                  <span className="pl-meta-item">
                    <Clock size={12} className="pl-meta-icon" />
                    Awaiting response
                  </span>
                )}
              </div>
            </div>
            {level && <LevelBadge level={level} />}
          </div>

          {matchPct !== null && (
            <div className="pl-card-section">
              <MatchBar pct={matchPct} />
            </div>
          )}

          {goals.length > 0 && (
            <div className="pl-card-section">
              <div className="pl-section-label">Shared goals</div>
              <GoalTags goals={goals} />
            </div>
          )}

          <div className="pl-card-actions">
            {variant === 'accepted' && (
              <>
                <button
                  className="pl-btn pl-btn--outline"
                  onClick={() => navigate(`/profile/${other?.id}`)}
                >
                  <User size={14} strokeWidth={2.25} />
                  Profile
                </button>
                <button
                  className="pl-btn pl-btn--outline"
                  onClick={() => navigate(`/chat/${other?.id}`)}
                >
                  <MessageCircle size={14} strokeWidth={2.25} />
                  Message
                </button>
                <button
                  className="pl-btn pl-btn--solid"
                  onClick={() => navigate(`/workouts/partner/${other?.id}`)}
                >
                  <UserCheck size={14} strokeWidth={2.25} />
                  View Workouts
                </button>
                <button
                  className="pl-btn pl-btn--outline pl-btn--danger"
                  onClick={() => onRemove(connection.id)}
                >
                  <XCircle size={13} strokeWidth={2.25} />
                  Remove
                </button>
              </>
            )}
            {variant === 'incoming' && (
              <>
                <button className="pl-btn pl-btn--accept" onClick={() => onAccept(connection.id)}>
                  <Check size={14} strokeWidth={2.75} />
                  Accept
                </button>
                <button className="pl-btn pl-btn--outline pl-btn--danger" onClick={() => onDecline(connection.id)}>
                  <X size={14} strokeWidth={2.5} />
                  Decline
                </button>
              </>
            )}
            {variant === 'sent' && (
              <>
                <span className="pl-pending-badge">
                  <span className="pl-pending-dot" />
                  Pending response
                </span>
                <button className="pl-btn pl-btn--ghost" onClick={() => onRemove(connection.id)}>
                  <XCircle size={13} />
                  Cancel request
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────
function HandshakeGlyph() {
  return (
    <div className="pl-handshake-glyph">
      <div className="pl-handshake-user pl-handshake-user--left">
        <User size={22} strokeWidth={2.25} style={{ color: ACCENT }} />
      </div>
      <div className="pl-handshake-user pl-handshake-user--right">
        <User size={22} strokeWidth={2.25} style={{ color: ACCENT }} />
      </div>
      <div className="pl-handshake-heart" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})` }}>
        <Heart size={20} strokeWidth={2.5} />
      </div>
    </div>
  );
}

function EmptyPartners({ onAIMatch }) {
  return (
    <div className="pl-empty">
      <div className="pl-empty-icon-wrap">
        <span className="pl-empty-glow" style={{ background: ACCENT + '33' }} />
        <div className="pl-empty-icon-bg" style={{ background: ACCENT + '10' }}>
          <HandshakeGlyph />
        </div>
      </div>
      <h3 className="pl-empty-title">No workout partners yet</h3>
      <p className="pl-empty-sub">Find someone who matches your goals, schedule, and fitness level — then never train alone again.</p>
      <div className="pl-empty-actions">
        <Link to="/partners/find" className="pl-btn pl-btn--outline pl-btn--lg">
          <Search size={15} strokeWidth={2.5} />
          Browse Athletes
        </Link>
        <button
          className="pl-btn pl-btn--solid pl-btn--lg"
          onClick={onAIMatch}
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})`, boxShadow: `0 10px 24px -8px ${ACCENT}99` }}
        >
          <Sparkles size={15} strokeWidth={2.5} />
          Try AI Match
        </button>
      </div>
    </div>
  );
}

function EmptyIncoming() {
  return (
    <div className="pl-empty">
      <div className="pl-empty-icon-wrap">
        <span className="pl-empty-glow" style={{ background: ACCENT + '33' }} />
        <div className="pl-empty-icon-bg" style={{ background: ACCENT + '14', color: ACCENT }}>
          <Inbox size={42} strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="pl-empty-title">No pending requests</h3>
      <p className="pl-empty-sub">When someone sends you a partner request, it will appear here for you to review.</p>
    </div>
  );
}

function EmptySent() {
  return (
    <div className="pl-empty">
      <div className="pl-empty-icon-wrap">
        <span className="pl-empty-glow" style={{ background: ACCENT + '33' }} />
        <div className="pl-empty-icon-bg" style={{ background: ACCENT + '14', color: ACCENT }}>
          <Send size={38} strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="pl-empty-title">No sent requests</h3>
      <p className="pl-empty-sub">Browse athletes and send your first partner request to start training together.</p>
      <Link to="/partners/find" className="pl-btn pl-btn--solid pl-btn--lg" style={{ background: ACCENT, boxShadow: `0 8px 20px -6px ${ACCENT}80` }}>
        <Search size={15} strokeWidth={2.5} />
        Browse Athletes
      </Link>
    </div>
  );
}

// ── AI Match section ──────────────────────────────────────────────────────────
function AIMatchHero({ suggestions }) {
  const [analyzing, setAnalyzing] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAnalyzing(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="pl-ai-hero"
      style={{
        background: `radial-gradient(80% 100% at 0% 0%, ${ACCENT}15 0%, transparent 60%), radial-gradient(80% 100% at 100% 100%, ${ACCENT}1f 0%, transparent 60%), linear-gradient(135deg, #fff, #fef2f2)`,
        border: `1px solid ${ACCENT}22`,
      }}
    >
      <div className="pl-ai-hero-sparkle" style={{ color: ACCENT }}>
        <Sparkles size={80} strokeWidth={1} />
      </div>

      <div className="pl-ai-hero-body">
        <div
          className="pl-ai-hero-icon"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})` }}
        >
          <Sparkles size={26} strokeWidth={2.25} />
        </div>
        <div className="pl-ai-hero-text">
          <div className="pl-ai-hero-title-row">
            <h2 className="pl-ai-hero-title">AI-Powered Matching</h2>
            <span className="pl-ai-beta" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -20)})` }}>BETA</span>
          </div>
          <div className="pl-ai-hero-status">
            {analyzing ? (
              <>
                <span className="pl-ai-dots">
                  <span className="pl-ai-dot" style={{ background: ACCENT, animationDelay: '0s' }} />
                  <span className="pl-ai-dot" style={{ background: ACCENT, animationDelay: '.2s' }} />
                  <span className="pl-ai-dot" style={{ background: ACCENT, animationDelay: '.4s' }} />
                </span>
                Analyzing your fitness profile…
              </>
            ) : (
              <>
                <UserPlus size={15} strokeWidth={2.5} style={{ color: '#10B981' }} />
                Found {suggestions.length} highly compatible athletes near you.
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pl-ai-progress-track">
        <div
          className={`pl-ai-progress-fill ${analyzing ? 'pl-ai-progress-fill--shimmer' : ''}`}
          style={{ background: analyzing ? undefined : ACCENT }}
        />
      </div>

      <div className="pl-ai-dimensions">
        <span className="pl-ai-dim"><Target size={13} /> Goals · 6 dimensions</span>
        <span className="pl-ai-dim"><Calendar size={13} /> Schedule overlap</span>
        <span className="pl-ai-dim"><MapPin size={13} /> Proximity</span>
        <span className="pl-ai-dim"><TrendingUp size={13} /> Skill level</span>
      </div>
    </div>
  );
}

function AICard({ suggestion, index, onSend }) {
  const name = suggestion.username || `${suggestion.first_name || ''} ${suggestion.last_name || ''}`.trim() || 'Athlete';
  const level = suggestion.fitness_level || null;
  const matchPct = suggestion.match_score ? Math.round(suggestion.match_score * 100) : Math.floor(75 + Math.random() * 22);
  const goals = suggestion.workout_types || [];

  return (
    <article
      className="pl-ai-card"
      style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
    >
      <div
        className="pl-ai-card-badge"
        style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})` }}
      >
        <Sparkles size={13} strokeWidth={2.5} />
        {matchPct}% match
      </div>

      <div className="pl-ai-card-body">
        <div className="pl-ai-card-top">
          <Avatar name={name} size={52} />
          <div>
            <h3 className="pl-card-name">{name}</h3>
            {level && <div className="pl-ai-card-level"><LevelBadge level={level} /></div>}
          </div>
        </div>

        {suggestion.bio && (
          <div
            className="pl-ai-reason"
            style={{ background: ACCENT + '0a', border: `1px solid ${ACCENT}1f` }}
          >
            <Sparkles size={14} strokeWidth={2.25} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
            <span><strong>Why this match:</strong> {suggestion.bio}</span>
          </div>
        )}

        {goals.length > 0 && <GoalTags goals={goals} />}

        <div className="pl-ai-card-actions">
          <button
            className="pl-btn pl-btn--solid pl-ai-card-send"
            style={{ background: ACCENT, boxShadow: `0 8px 18px -6px ${ACCENT}99` }}
            onClick={() => onSend(suggestion.id)}
          >
            <UserPlus size={14} strokeWidth={2.5} />
            Send Request
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const PartnerList = () => {
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted');
  const [mode, setMode] = useState('browse');
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const [connRes, sugRes] = await Promise.all([
          matchApi.getConnections(),
          matchApi.getSuggestions().catch(() => ({ data: [] })),
        ]);
        setConnections(connRes.data?.connections || connRes.data || []);
        setSuggestions(sugRes.data?.suggestions || sugRes.data || []);
      } catch {
        // silently fail — empty states handle missing data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAccept = async (id) => {
    try {
      await matchApi.updateConnection(id, 'accepted');
      setConnections(cs => cs.map(c => c.id === id ? { ...c, status: 'accepted' } : c));
    } catch {
      alert('Update failed.');
    }
  };

  const handleDecline = async (id) => {
    try {
      await matchApi.updateConnection(id, 'declined');
      setConnections(cs => cs.filter(c => c.id !== id));
    } catch {
      alert('Update failed.');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this connection?')) return;
    try {
      await matchApi.removeConnection(id);
      setConnections(cs => cs.filter(c => c.id !== id));
    } catch {
      alert('Remove failed.');
    }
  };

  const handleSendRequest = async (userId) => {
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

  const byTab = {
    accepted: connections.filter(c => c.status === 'accepted'),
    pending:  connections.filter(c => c.status === 'pending' && !c.is_requester),
    sent:     connections.filter(c => c.status === 'pending' && c.is_requester),
  };

  const counts = {
    accepted: byTab.accepted.length,
    pending:  byTab.pending.length,
    sent:     byTab.sent.length,
  };

  if (loading) return <div className="loading-screen">Loading partners...</div>;

  const displayed = byTab[activeTab] || [];

  const renderTabContent = () => {
    if (activeTab === 'accepted' && displayed.length === 0)
      return <EmptyPartners onAIMatch={() => setMode('ai')} />;
    if (activeTab === 'pending' && displayed.length === 0)
      return <EmptyIncoming />;
    if (activeTab === 'sent' && displayed.length === 0)
      return <EmptySent />;

    const variant = activeTab === 'accepted' ? 'accepted' : activeTab === 'pending' ? 'incoming' : 'sent';
    return (
      <div className="pl-grid">
        {displayed.map((c, i) => (
          <PartnerCard
            key={c.id}
            connection={c}
            index={i}
            variant={variant}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onRemove={handleRemove}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="pl-page">
      {/* Page header */}
      <div className="pl-header">
        <div>
          <h1 className="pl-title">
            <span className="pl-title-icon" style={{ background: ACCENT }}>
              <Users size={22} strokeWidth={2.5} />
            </span>
            Partners
          </h1>
          <p className="pl-subtitle">Connect with athletes who share your goals, schedule, and fitness level.</p>
        </div>

        <div className="pl-header-right">
          {mode === 'ai' && (
            <span
              className="pl-ai-badge"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -20)})` }}
            >
              <Sparkles size={10} strokeWidth={2.5} />
              AI POWERED
            </span>
          )}
          <ModeToggle mode={mode} setMode={setMode} />
        </div>
      </div>

      {/* Content */}
      {mode === 'ai' ? (
        <>
          <AIMatchHero suggestions={suggestions} />
          {suggestions.length === 0 ? (
            <div className="pl-ai-no-suggestions">
              <Sparkles size={28} style={{ color: '#D1D5DB' }} />
              <p>Complete your fitness profile to get AI match suggestions.</p>
              <Link to="/profile" className="pl-btn pl-btn--solid pl-btn--lg" style={{ background: ACCENT }}>
                Update Profile
              </Link>
            </div>
          ) : (
            <div className="pl-grid">
              {suggestions.map((s, i) => (
                <AICard
                  key={s.id}
                  suggestion={s}
                  index={i}
                  onSend={handleSendRequest}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="pl-tabs-wrap">
            <TabStrip activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
          </div>
          {renderTabContent()}
        </>
      )}
    </div>
  );
};

export default PartnerList;
