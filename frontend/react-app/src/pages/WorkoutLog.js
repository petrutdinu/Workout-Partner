import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workoutApi } from '../api';
import {
  Dumbbell, Plus, Flame, Clock, Calendar, Layers,
  MoreVertical, Eye, Trash2, Lock, ArrowUpDown,
  ChevronDown, LayoutGrid, Footprints, Home, HeartPulse,
  SearchX, Sparkles, Users, TrendingUp,
} from 'lucide-react';
import './WorkoutLog.css';

const ACCENT = '#DC2626';
const PAGE_SIZE = 20;

const TYPE_META = {
  gym:          { Icon: Dumbbell,    label: 'Gym' },
  running:      { Icon: Footprints,  label: 'Running' },
  home:         { Icon: Home,        label: 'Home' },
  cardio:       { Icon: HeartPulse,  label: 'Cardio' },
  cycling:      { Icon: HeartPulse,  label: 'Cycling' },
  swimming:     { Icon: HeartPulse,  label: 'Swimming' },
  yoga:         { Icon: HeartPulse,  label: 'Yoga' },
  crossfit:     { Icon: Dumbbell,    label: 'CrossFit' },
  hiking:       { Icon: Footprints,  label: 'Hiking' },
  boxing:       { Icon: Dumbbell,    label: 'Boxing' },
  calisthenics: { Icon: Dumbbell,    label: 'Calisthenics' },
  other:        { Icon: Dumbbell,    label: 'Other' },
};

const FILTERS = [
  { id: 'all',     label: 'All',     Icon: LayoutGrid },
  { id: 'gym',     label: 'Gym',     Icon: Dumbbell },
  { id: 'running', label: 'Running', Icon: Footprints },
  { id: 'home',    label: 'Home',    Icon: Home },
];

const SORT_OPTIONS = [
  { value: 'date-desc',     label: 'Newest first' },
  { value: 'date-asc',      label: 'Oldest first' },
  { value: 'kcal-desc',     label: 'Most calories' },
  { value: 'duration-desc', label: 'Longest' },
];

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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeDay(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return null;
}

// ── Card dropdown menu ────────────────────────────────────────────────────────

function CardMenu({ open, onClose, onDelete, sessionId }) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <>
      <div className="wl-menu-backdrop" onClick={onClose} />
      <div className="wl-menu">
        <button className="wl-menu-item" onClick={() => { navigate(`/workouts/${sessionId}`); onClose(); }}>
          <Eye size={15} className="wl-menu-icon" />
          View Details
        </button>
        <div className="wl-menu-divider" />
        <button className="wl-menu-item wl-menu-item--danger" onClick={() => { onDelete(); onClose(); }}>
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </>
  );
}

// ── Single workout card ───────────────────────────────────────────────────────

function WorkoutCard({ session, index, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = TYPE_META[session.workout_type] || TYPE_META.gym;
  const TypeIcon = meta.Icon;
  const title = (session.title && session.title.trim()) || `Workout #${session.id.slice(0, 8)}`;
  const kcal = session.total_calories ? Math.round(session.total_calories) : 0;
  const rel = relativeDay(session.started_at);
  const isPublic = session.is_public;

  return (
    <article
      className="wl-card"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      <span className="wl-card-accent" />

      <div className="wl-card-inner">
        {/* Icon block */}
        <div
          className="wl-card-icon"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})` }}
        >
          <TypeIcon size={26} strokeWidth={2.25} color="white" />
        </div>

        {/* Content */}
        <div className="wl-card-body">
          <div className="wl-card-title-row">
            <Link to={`/workouts/${session.id}`} className="wl-card-title">{title}</Link>
            <div className="wl-card-menu-wrap">
              <button
                className="wl-more-btn"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="More options"
              >
                <MoreVertical size={18} />
              </button>
              <CardMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onDelete={() => onDelete(session.id)}
                sessionId={session.id}
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="wl-card-meta">
            <span className="wl-meta-item">
              <Calendar size={13} className="wl-meta-icon" />
              {formatDate(session.started_at)}
              {rel && <span className="wl-meta-rel">· {rel}</span>}
            </span>
            {session.duration_minutes > 0 && (
              <span className="wl-meta-item">
                <Clock size={13} className="wl-meta-icon" />
                {session.duration_minutes} min
              </span>
            )}
            {kcal > 0 && (
              <span className="wl-meta-item wl-meta-kcal">
                <Flame size={13} />
                {kcal.toLocaleString()} kcal
              </span>
            )}
            {session.exercises?.length > 0 && (
              <span className="wl-meta-item">
                <Layers size={13} className="wl-meta-icon" />
                {session.exercises.length} exercises
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="wl-card-tags">
            <span className="wl-tag wl-tag--type">
              <TypeIcon size={11} strokeWidth={2.5} />
              {meta.label}
            </span>
            {isPublic ? (
              <span className="wl-tag wl-tag--public">
                <span className="wl-tag-dot" />
                Public
              </span>
            ) : (
              <span className="wl-tag wl-tag--private">
                <Lock size={10} strokeWidth={2.5} />
                Private
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({ filter, setFilter, sort, setSort, count }) {
  return (
    <div className="wl-filter-bar">
      <div className="wl-filter-pills">
        {FILTERS.map(f => {
          const active = filter === f.id;
          const FIcon = f.Icon;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`wl-filter-pill ${active ? 'wl-filter-pill--active' : ''}`}
            >
              <FIcon size={14} strokeWidth={2.25} />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="wl-filter-right">
        <span className="wl-filter-count">
          <strong>{count}</strong> result{count === 1 ? '' : 's'}
        </span>
        <div className="wl-sort-wrap">
          <ArrowUpDown size={13} className="wl-sort-icon-left" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="wl-sort-select"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="wl-sort-icon-right" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="wl-empty">
      <div className="wl-empty-icon-wrap">
        <span className="wl-empty-glow" />
        <div className="wl-empty-icon">
          <Dumbbell size={44} strokeWidth={2} color={ACCENT} />
        </div>
      </div>
      <h3 className="wl-empty-title">No workouts yet</h3>
      <p className="wl-empty-sub">Start logging your fitness journey. Every rep counts.</p>
      <Link to="/workouts/new" className="wl-empty-cta">
        <Plus size={16} strokeWidth={2.5} />
        Log First Workout
      </Link>
      <div className="wl-empty-pills">
        <span><Sparkles size={14} /> Tracks streaks</span>
        <span><Users size={14} /> Visible to partners</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const WorkoutLog = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date-desc');

  const fetchSessions = async (p = 1) => {
    setLoading(true);
    try {
      const res = await workoutApi.getSessions({ offset: (p - 1) * PAGE_SIZE, limit: PAGE_SIZE });
      const data = res.data?.sessions || res.data || [];
      if (p === 1) setSessions(data);
      else setSessions(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError('Failed to load workouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(1); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await workoutApi.deleteSession(id);
      setSessions(s => s.filter(x => x.id !== id));
    } catch {
      alert('Delete failed.');
    }
  };

  const filtered = useMemo(() => {
    let arr = sessions.filter(s => filter === 'all' || s.workout_type === filter);
    const sorters = {
      'date-desc':     (a, b) => new Date(b.started_at) - new Date(a.started_at),
      'date-asc':      (a, b) => new Date(a.started_at) - new Date(b.started_at),
      'kcal-desc':     (a, b) => (b.total_calories || 0) - (a.total_calories || 0),
      'duration-desc': (a, b) => (b.duration_minutes || 0) - (a.duration_minutes || 0),
    };
    return [...arr].sort(sorters[sort] || sorters['date-desc']);
  }, [sessions, filter, sort]);

  const totals = useMemo(() => ({
    count:   sessions.length,
    kcal:    Math.round(sessions.reduce((s, w) => s + (parseFloat(w.total_calories) || 0), 0)),
    minutes: sessions.reduce((s, w) => s + (w.duration_minutes || 0), 0),
  }), [sessions]);

  if (loading && sessions.length === 0) {
    return <div className="loading-screen">Loading workouts...</div>;
  }

  return (
    <div className="wl-page">
      {/* Page header */}
      <div className="wl-header">
        <div>
          <h1 className="wl-title">
            <span className="wl-title-icon">
              <Dumbbell size={22} strokeWidth={2.5} />
            </span>
            My Workouts
          </h1>
          <p className="wl-subtitle">Every session you've logged — searchable, sortable, and yours.</p>
        </div>
        <Link to="/workouts/new" className="wl-new-btn">
          <Plus size={16} strokeWidth={2.5} />
          New Session
        </Link>
      </div>

      {error && <div className="wl-error">{error}</div>}

      {/* Stat strip */}
      {sessions.length > 0 && (
        <div className="wl-stat-strip">
          {[
            { Icon: Dumbbell,    label: 'Total Workouts',   val: totals.count,                  color: ACCENT },
            { Icon: Flame,       label: 'Calories Burned',  val: totals.kcal.toLocaleString(),  color: '#EA580C' },
            { Icon: Clock,       label: 'Minutes Trained',  val: totals.minutes.toLocaleString(), color: '#0EA5E9' },
            { Icon: TrendingUp,  label: 'Keep it up!',      val: '💪',                          color: '#10B981' },
          ].map(s => (
            <div key={s.label} className="wl-stat-chip">
              <div className="wl-stat-icon" style={{ background: s.color + '18', color: s.color }}>
                <s.Icon size={18} strokeWidth={2.25} />
              </div>
              <div>
                <div className="wl-stat-val">{s.val}</div>
                <div className="wl-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            sort={sort}
            setSort={setSort}
            count={filtered.length}
          />

          {filtered.length === 0 ? (
            <div className="wl-no-results">
              <SearchX size={28} className="wl-no-results-icon" />
              <div className="wl-no-results-title">No workouts match this filter</div>
              <button className="wl-no-results-clear" onClick={() => setFilter('all')}>
                Clear filter
              </button>
            </div>
          ) : (
            <div className="wl-grid">
              {filtered.map((s, i) => (
                <WorkoutCard key={s.id} session={s} index={i} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="wl-load-more-wrap">
              <button
                className="wl-load-more-btn"
                onClick={() => { const next = page + 1; setPage(next); fetchSessions(next); }}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkoutLog;
