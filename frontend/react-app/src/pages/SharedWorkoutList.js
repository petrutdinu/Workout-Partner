import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sharedWorkoutApi } from '../api';
import {
  Trophy, Swords, Plus, Users, Dumbbell, ChevronRight,
  Sparkles, Calendar, Clock, CheckCircle2, ArrowRight,
  Layers, Repeat, Flame, X, Hash,
} from 'lucide-react';
import './SharedWorkoutList.css';

const ACCENT = '#DC2626';

const WORKOUT_TYPES = [
  'gym', 'running', 'cycling', 'swimming', 'yoga',
  'crossfit', 'hiking', 'boxing', 'calisthenics', 'other',
];

const STATUS_META = {
  pending:  { label: 'Pending',     bg: '#FFEDD5', fg: '#9A3412', dot: '#F97316', pulse: false },
  active:   { label: 'In Progress', bg: '#DCFCE7', fg: '#15803D', dot: '#22C55E', pulse: true  },
  finished: { label: 'Completed',   bg: '#F3F4F6', fg: '#4B5563', dot: '#9CA3AF', pulse: false },
};

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const clamp = v => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Hero banner ───────────────────────────────────────────────────────────────
function HeroBanner({ stats }) {
  return (
    <section className="cs-hero">
      {/* red gradient left edge */}
      <div
        className="cs-hero-gradient"
        style={{ background: `radial-gradient(70% 100% at 0% 50%, ${ACCENT}50 0%, ${ACCENT}1f 30%, transparent 70%)` }}
      />
      {/* diagonal hatching */}
      <div className="cs-hero-hatch" />

      <div className="cs-hero-inner">
        {/* Icon + copy */}
        <div className="cs-hero-left">
          <div className="cs-hero-icon-wrap">
            <span className="cs-hero-icon-blur" style={{ background: ACCENT + '70' }} />
            <div
              className="cs-hero-icon"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -32)})`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 12px 24px -6px ${ACCENT}99`,
              }}
            >
              <Swords size={36} strokeWidth={2.25} />
            </div>
          </div>
          <div className="cs-hero-copy">
            <div className="cs-hero-eyebrow" style={{ color: ACCENT }}>⚡ Head-to-head</div>
            <h2 className="cs-hero-title">Ready to compete?</h2>
            <p className="cs-hero-sub">
              Start a session with a partner and see who pushes harder — every set, every rep.
            </p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="cs-hero-stats">
          {[
            { Icon: Trophy,  label: 'Won',      val: stats.won,              tone: '#FBBF24' },
            { Icon: Swords,  label: 'Competed',  val: stats.total,            tone: ACCENT   },
            { Icon: Trophy,  label: 'Win Rate',  val: `${stats.winRate}%`,    tone: '#10B981' },
          ].map(s => (
            <div key={s.label} className="cs-stat-chip">
              <div className="cs-stat-icon" style={{ background: s.tone + '22', color: s.tone }}>
                <s.Icon size={16} strokeWidth={2.5} />
              </div>
              <div>
                <div className="cs-stat-val">{s.val}</div>
                <div className="cs-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '1', Icon: Users,    title: 'Choose a Partner', body: 'Select from your connected workout partners.' },
    { n: '2', Icon: Dumbbell, title: 'Log Together',     body: 'Both of you log exercises in the same session.' },
    { n: '3', Icon: Trophy,   title: 'See Who Wins',     body: 'Compare sets, reps, calories, and duration.' },
  ];

  return (
    <section className="cs-how">
      <div className="cs-how-header">
        <div>
          <div className="cs-how-eyebrow" style={{ color: ACCENT }}>How it works</div>
          <h2 className="cs-how-title">Three steps to your first challenge</h2>
        </div>
        <div className="cs-how-hint">
          <Sparkles size={13} />
          Takes under a minute
        </div>
      </div>

      <div className="cs-how-grid">
        {steps.map((s, i) => (
          <div key={s.n} className="cs-step-card" style={{ animationDelay: `${i * 80}ms` }}>
            {/* step number badge */}
            <div
              className="cs-step-num"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})`,
                boxShadow: `0 6px 14px -4px ${ACCENT}99`,
              }}
            >
              {s.n}
            </div>

            <div className="cs-step-icon" style={{ background: ACCENT + '12', color: ACCENT }}>
              <s.Icon size={22} strokeWidth={2.25} />
            </div>
            <h3 className="cs-step-title">{s.title}</h3>
            <p className="cs-step-body">{s.body}</p>

            {i < 2 && (
              <div className="cs-step-connector">
                <ChevronRight size={14} strokeWidth={2.5} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="cs-empty">
      <div className="cs-empty-icon-wrap">
        <span className="cs-empty-glow" style={{ background: `radial-gradient(circle, ${ACCENT}55, transparent 70%)` }} />
        <div
          className="cs-empty-icon"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}15, #FED7AA60)`,
            boxShadow: `inset 0 0 0 1px ${ACCENT}22`,
          }}
        >
          <Trophy size={52} strokeWidth={1.75} className="cs-trophy-glint" style={{ color: ACCENT }} />
        </div>
      </div>
      <h3 className="cs-empty-title">No competitive sessions yet</h3>
      <p className="cs-empty-sub">
        Challenge a partner to a workout and see who performs better in real time. Every session, every rep counts.
      </p>
      <div className="cs-empty-actions">
        <Link to="/partners" className="cs-btn cs-btn--outline">
          <Users size={15} strokeWidth={2.5} />
          Browse Partners
        </Link>
        <button
          className="cs-btn cs-btn--solid"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})`,
            boxShadow: `0 10px 24px -8px ${ACCENT}99`,
          }}
          onClick={onNew}
        >
          <Swords size={15} strokeWidth={2.5} />
          Create First Session
        </button>
      </div>
    </div>
  );
}

// ── Status chip ───────────────────────────────────────────────────────────────
function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className="cs-status-chip" style={{ background: m.bg, color: m.fg }}>
      <span
        className={`cs-status-dot ${m.pulse ? 'cs-status-dot--pulse' : ''}`}
        style={{ background: m.dot }}
      />
      {m.label}
    </span>
  );
}

// ── Session card ──────────────────────────────────────────────────────────────
function SessionCard({ room, index }) {
  const navigate = useNavigate();
  const isPending = room.status === 'pending';
  const isActive = room.status === 'active';

  return (
    <article
      className="cs-card"
      style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}
    >
      {/* Header */}
      <div className="cs-card-header">
        <div className="cs-card-header-left">
          <h3 className="cs-card-title">{room.title}</h3>
          <div className="cs-card-date">
            <Calendar size={12} className="cs-card-date-icon" />
            {room.started_at ? formatDate(room.started_at) : room.ended_at ? formatDate(room.ended_at) : 'Not started'}
          </div>
        </div>
        <StatusChip status={room.status} />
      </div>

      {/* VS body — simplified since we may not have full competitor data */}
      <div className="cs-card-vs">
        <div className="cs-competitor cs-competitor--me">
          <div className="cs-competitor-avatar" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})` }}>
            Me
          </div>
          <div className="cs-competitor-info">
            <div className="cs-competitor-role">You</div>
            <div className="cs-competitor-name">Host</div>
          </div>
        </div>

        <div className="cs-vs-badge">VS</div>

        <div className="cs-competitor cs-competitor--partner">
          <div className="cs-competitor-avatar" style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)' }}>
            ?
          </div>
          <div className="cs-competitor-info">
            <div className="cs-competitor-role">Partner</div>
            <div className="cs-competitor-name">{room.workout_type || 'Any'}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="cs-card-footer">
        <div className="cs-card-footer-status">
          {isPending ? (
            <span className="cs-footer-text cs-footer-text--amber">
              <Clock size={13} />
              Waiting for both to start
            </span>
          ) : isActive ? (
            <span className="cs-footer-text cs-footer-text--green">
              <span className="cs-live-dot" />
              Live — both logging
            </span>
          ) : (
            <span className="cs-footer-text">
              <CheckCircle2 size={13} />
              Session complete
            </span>
          )}
        </div>
        <button
          className="cs-view-btn"
          style={{ background: ACCENT, boxShadow: `0 6px 16px -6px ${ACCENT}99` }}
          onClick={() => navigate(`/shared-workouts/${room.id}`)}
        >
          View Details
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}

// ── Create / Join modal ───────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('create');
  const [form, setForm] = useState({ title: '', workout_type: 'gym' });
  const [joinId, setJoinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await sharedWorkoutApi.create(form);
      navigate(`/shared-workouts/${res.data.id}`);
    } catch {
      setError('Failed to create session. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    setJoining(true);
    setError('');
    try {
      await sharedWorkoutApi.join(joinId.trim());
      navigate(`/shared-workouts/${joinId.trim()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join session.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="cs-modal-backdrop" onClick={onClose}>
      <div className="cs-modal" onClick={e => e.stopPropagation()}>
        <div className="cs-modal-header">
          <div className="cs-modal-title-row">
            <div className="cs-modal-icon" style={{ background: ACCENT }}>
              <Swords size={18} strokeWidth={2.25} />
            </div>
            <h2 className="cs-modal-title">Start a Challenge</h2>
          </div>
          <button className="cs-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="cs-modal-tabs">
          <button
            className={`cs-modal-tab ${tab === 'create' ? 'cs-modal-tab--active' : ''}`}
            onClick={() => setTab('create')}
            style={tab === 'create' ? { color: ACCENT } : {}}
          >
            <Plus size={14} strokeWidth={2.5} />
            Create New
          </button>
          <button
            className={`cs-modal-tab ${tab === 'join' ? 'cs-modal-tab--active' : ''}`}
            onClick={() => setTab('join')}
            style={tab === 'join' ? { color: ACCENT } : {}}
          >
            <Hash size={14} strokeWidth={2.5} />
            Join by ID
          </button>
        </div>

        <div className="cs-modal-body">
          {error && <div className="cs-modal-error">{error}</div>}

          {tab === 'create' ? (
            <form onSubmit={handleCreate}>
              <div className="cs-modal-field">
                <label className="cs-modal-label">Session Title *</label>
                <input
                  className="cs-modal-input"
                  required
                  placeholder="e.g. Chest Day Battle"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="cs-modal-field">
                <label className="cs-modal-label">Workout Type</label>
                <div className="cs-modal-select-wrap">
                  <select
                    className="cs-modal-input cs-modal-select"
                    value={form.workout_type}
                    onChange={e => setForm(f => ({ ...f, workout_type: e.target.value }))}
                  >
                    {WORKOUT_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <ChevronRight size={14} className="cs-modal-select-icon" style={{ transform: 'rotate(90deg)' }} />
                </div>
              </div>
              <button
                type="submit"
                className="cs-btn cs-btn--solid cs-btn--full"
                style={{ background: ACCENT, boxShadow: `0 8px 20px -6px ${ACCENT}80` }}
                disabled={creating}
              >
                <Swords size={15} strokeWidth={2.5} />
                {creating ? 'Creating…' : 'Create & Get Session ID'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin}>
              <div className="cs-modal-field">
                <label className="cs-modal-label">Session ID</label>
                <input
                  className="cs-modal-input"
                  placeholder="Paste session ID here"
                  value={joinId}
                  onChange={e => setJoinId(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="cs-btn cs-btn--solid cs-btn--full"
                style={{ background: ACCENT, boxShadow: `0 8px 20px -6px ${ACCENT}80` }}
                disabled={joining}
              >
                <ArrowRight size={15} strokeWidth={2.5} />
                {joining ? 'Joining…' : 'Join Session'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const SharedWorkoutList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    sharedWorkoutApi.getMyRooms()
      .then(res => setRooms(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    won:     rooms.filter(r => r.status === 'finished').length,
    total:   rooms.length,
    winRate: rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'finished').length / rooms.length) * 100) : 0,
  };

  if (loading) return <div className="cs-loading">Loading sessions…</div>;

  return (
    <div className="cs-page">
      {/* Page header */}
      <div className="cs-header">
        <div>
          <h1 className="cs-title">
            <span className="cs-title-icon" style={{ background: ACCENT }}>
              <Trophy size={22} strokeWidth={2.5} />
            </span>
            Competitive Sessions
          </h1>
          <p className="cs-subtitle">Challenge your workout partners and track who performs better.</p>
        </div>
        <button
          className="cs-btn cs-btn--solid"
          style={{ background: ACCENT, boxShadow: `0 8px 20px -6px ${ACCENT}80` }}
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Session
        </button>
      </div>

      <HeroBanner stats={stats} />

      {rooms.length === 0 ? (
        <>
          <EmptyState onNew={() => setShowModal(true)} />
          <HowItWorks />
        </>
      ) : (
        <section>
          <div className="cs-results-header">
            <div>
              <h2 className="cs-results-count">{rooms.length} session{rooms.length === 1 ? '' : 's'}</h2>
              <p className="cs-results-sub">Live, pending, and completed challenges</p>
            </div>
          </div>
          <div className="cs-list">
            {rooms.map((r, i) => (
              <SessionCard key={r.id} room={r} index={i} />
            ))}
          </div>
        </section>
      )}

      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default SharedWorkoutList;
