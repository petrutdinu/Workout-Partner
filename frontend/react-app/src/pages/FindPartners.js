import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { matchApi } from '../api';
import {
  Search, Sparkles, ArrowRight, Activity, Target, MapPin,
  ChevronDown, RotateCcw, UserPlus, User, Zap, Info,
  Users,
} from 'lucide-react';
import './FindPartners.css';

const ACCENT = '#DC2626';

const LEVEL_TONES = {
  Beginner:     { bg: '#DCFCE7', fg: '#15803D', dot: '#22C55E' },
  Intermediate: { bg: '#DBEAFE', fg: '#1E40AF', dot: '#3B82F6' },
  Advanced:     { bg: '#FCE7F3', fg: '#9D174D', dot: '#DB2777' },
  Elite:        { bg: '#EDE9FE', fg: '#5B21B6', dot: '#7C3AED' },
};

const AVATAR_TONES = [
  '#0EA5E9', '#7C3AED', '#10B981', '#EA580C', '#EC4899', '#F97316', '#DC2626',
];

function getAvatarTone(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const clamp = v => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ── AI Smart Match banner ─────────────────────────────────────────────────
function AISmartMatchBanner() {
  const navigate = useNavigate();
  return (
    <div
      className="fp-ai-banner"
      onClick={() => navigate('/partners/match')}
      style={{
        background: `linear-gradient(135deg, ${ACCENT} 0%, ${shade(ACCENT, -28)} 50%, ${shade(ACCENT, -44)} 100%)`,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate('/partners/match')}
    >
      {/* Decorative orbs */}
      <span className="fp-orb fp-orb--top-right" />
      <span className="fp-orb fp-orb--bottom-left" />
      {/* Floating sparkles */}
      <span className="fp-sparkle-dot fp-sparkle-dot--1">✦</span>
      <span className="fp-sparkle-dot fp-sparkle-dot--2">✦</span>
      <span className="fp-sparkle-dot fp-sparkle-dot--3">✦</span>

      <div className="fp-ai-banner-inner">
        {/* Icon */}
        <div className="fp-ai-icon-wrap">
          <span className="fp-ai-icon-ring" />
          <div className="fp-ai-icon fp-sparkle-pulse" style={{ color: ACCENT }}>
            <Sparkles size={28} strokeWidth={2.25} />
          </div>
        </div>

        {/* Text */}
        <div className="fp-ai-text">
          <span className="fp-ai-pill">AI Powered · Beta</span>
          <h2 className="fp-ai-title">AI Smart Match</h2>
          <p className="fp-ai-sub">Let our algorithm find your perfect workout partner automatically.</p>
        </div>

        {/* Arrow button */}
        <div className="fp-ai-arrow" style={{ color: ACCENT }}>
          <ArrowRight size={20} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

// ── Filter card ───────────────────────────────────────────────────────────
function FilterCard({ filters, setFilter, onSearch, onReset }) {
  return (
    <div className="fp-filter-card">
      <div className="fp-filter-grid">
        {/* Fitness Level */}
        <div className="fp-filter-group">
          <label className="fp-filter-label">Fitness Level</label>
          <div className="fp-select-wrap">
            <Activity size={15} className="fp-select-icon-left" />
            <select
              className="fp-field fp-field--select"
              value={filters.fitness_level}
              onChange={e => setFilter({ fitness_level: e.target.value })}
            >
              <option value="">Any level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Elite">Elite</option>
            </select>
            <ChevronDown size={15} className="fp-select-icon-right" />
          </div>
        </div>

        {/* Goal */}
        <div className="fp-filter-group">
          <label className="fp-filter-label">Goal</label>
          <div className="fp-select-wrap">
            <Target size={15} className="fp-select-icon-left" />
            <select
              className="fp-field fp-field--select"
              value={filters.primary_goal}
              onChange={e => setFilter({ primary_goal: e.target.value })}
            >
              <option value="">Any goal</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="endurance">Endurance</option>
              <option value="flexibility">Flexibility</option>
              <option value="general_fitness">General Fitness</option>
            </select>
            <ChevronDown size={15} className="fp-select-icon-right" />
          </div>
        </div>

        {/* City */}
        <div className="fp-filter-group">
          <label className="fp-filter-label">City</label>
          <div className="fp-select-wrap">
            <MapPin size={15} className="fp-select-icon-left" />
            <input
              type="text"
              className="fp-field fp-field--text"
              placeholder="Any city"
              value={filters.city}
              onChange={e => setFilter({ city: e.target.value })}
            />
          </div>
        </div>

        {/* Search button */}
        <div className="fp-filter-group fp-filter-group--btn">
          <label className="fp-filter-label fp-filter-label--ghost">Search</label>
          <button
            type="button"
            className="fp-search-btn"
            style={{ background: ACCENT, boxShadow: `0 8px 20px -6px ${ACCENT}80` }}
            onClick={onSearch}
          >
            <Search size={16} strokeWidth={2.5} />
            Search
          </button>
        </div>
      </div>

      <ActiveFilters filters={filters} onReset={onReset} />
    </div>
  );
}

function ActiveFilters({ filters, onReset }) {
  const active = [
    filters.fitness_level && { key: 'fitness_level', Icon: Activity, label: filters.fitness_level },
    filters.primary_goal && { key: 'primary_goal', Icon: Target, label: filters.primary_goal.replace('_', ' ') },
    filters.city && { key: 'city', Icon: MapPin, label: filters.city },
  ].filter(Boolean);

  if (active.length === 0) return null;

  return (
    <div className="fp-active-filters">
      <span className="fp-active-label">Active:</span>
      {active.map(a => (
        <span
          key={a.key}
          className="fp-active-pill"
          style={{ background: ACCENT + '12', color: ACCENT }}
        >
          <a.Icon size={12} strokeWidth={2.5} />
          {a.label}
        </span>
      ))}
      <button className="fp-reset-link" onClick={onReset}>
        <RotateCcw size={13} />
        Reset filters
      </button>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 56 }) {
  const initials = (name || 'U').slice(0, 2).toUpperCase();
  const tone = getAvatarTone(name || 'U');
  return (
    <div
      className="fp-avatar"
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
    <span className="fp-level-badge" style={{ background: t.bg, color: t.fg }}>
      <span className="fp-level-dot" style={{ background: t.dot }} />
      {level}
    </span>
  );
}

// ── Athlete card ──────────────────────────────────────────────────────────
function AthleteCard({ athlete, index, isTopMatch, sentRequest, onSend }) {
  const navigate = useNavigate();
  const name = athlete.username || `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Athlete';
  const matchPct = athlete.match_score ? Math.round(athlete.match_score * 100) : null;
  const goals = athlete.workout_types || [];
  const level = athlete.fitness_level || null;

  return (
    <article
      className="fp-card"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      {isTopMatch && (
        <div
          className="fp-top-match-badge"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})`,
            boxShadow: `0 6px 16px -6px ${ACCENT}99`,
          }}
        >
          <Zap size={12} strokeWidth={2.75} />
          TOP MATCH
        </div>
      )}

      <div className="fp-card-body">
        {/* Top row */}
        <div className="fp-card-top">
          <Avatar name={name} />
          <div className="fp-card-info">
            <h3 className="fp-card-name">{name}</h3>
            {athlete.city && (
              <div className="fp-card-city">
                <MapPin size={12} className="fp-city-icon" />
                <span>{athlete.city}</span>
              </div>
            )}
            {athlete.bio && (
              <p className="fp-card-bio">{athlete.bio.slice(0, 80)}{athlete.bio.length > 80 ? '…' : ''}</p>
            )}
          </div>
        </div>

        {/* Level + goals */}
        <div className="fp-card-tags">
          {level && <LevelBadge level={level} />}
          {goals.map(g => (
            <span key={g} className="fp-goal-tag">{g}</span>
          ))}
        </div>

        {/* Compatibility bar */}
        {matchPct !== null && (
          <div className="fp-compat-wrap">
            <div className="fp-compat-labels">
              <span>Compatibility</span>
              <span style={{ color: ACCENT }}>{matchPct}% match</span>
            </div>
            <div className="fp-compat-track">
              <div
                className="fp-compat-fill"
                style={{
                  width: `${matchPct}%`,
                  background: `linear-gradient(90deg, ${ACCENT}, ${shade(ACCENT, 20)})`,
                  boxShadow: `0 0 8px ${ACCENT}55`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="fp-card-footer">
        <button
          className="fp-btn fp-btn--send"
          style={{
            background: sentRequest ? '#6B7280' : ACCENT,
            boxShadow: sentRequest ? 'none' : `0 6px 16px -6px ${ACCENT}99`,
          }}
          disabled={sentRequest}
          onClick={() => !sentRequest && onSend(athlete.id)}
        >
          <UserPlus size={14} strokeWidth={2.5} />
          {sentRequest ? 'Request Sent' : 'Send Request'}
        </button>
        <button
          className="fp-btn fp-btn--ghost"
          aria-label="View profile"
          onClick={() => navigate(`/profile/${athlete.id}`)}
        >
          <User size={14} strokeWidth={2.25} />
        </button>
      </div>
    </article>
  );
}

// ── Empty / no results ────────────────────────────────────────────────────
function NoResults({ onReset }) {
  const navigate = useNavigate();
  return (
    <div className="fp-empty">
      <div className="fp-empty-icon-wrap">
        <span className="fp-empty-glow" style={{ background: ACCENT + '33' }} />
        <div className="fp-empty-icon" style={{ background: ACCENT + '14', color: ACCENT }}>
          <Users size={42} strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="fp-empty-title">No athletes found</h3>
      <p className="fp-empty-sub">Try adjusting your filters — or let AI find your perfect match in seconds.</p>
      <div className="fp-empty-actions">
        <button className="fp-btn fp-btn--outline-gray" onClick={onReset}>
          <RotateCcw size={15} strokeWidth={2.5} />
          Reset Filters
        </button>
        <button
          className="fp-btn fp-btn--ai"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${shade(ACCENT, -28)})`,
            boxShadow: `0 10px 24px -8px ${ACCENT}99`,
          }}
          onClick={() => navigate('/partners/match')}
        >
          <Sparkles size={15} strokeWidth={2.5} />
          Try AI Smart Match
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
const FindPartners = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFiltersRaw] = useState({ fitness_level: '', primary_goal: '', city: '' });
  const [sentRequests, setSentRequests] = useState(new Set());
  const [searched, setSearched] = useState(false);

  const setFilter = patch => setFiltersRaw(f => ({ ...f, ...patch }));
  const reset = () => setFiltersRaw({ fitness_level: '', primary_goal: '', city: '' });

  const fetchAthletes = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await matchApi.browse(params);
      setAthletes(res.data || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAthletes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const sorted = useMemo(() => {
    return [...athletes].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }, [athletes]);

  const topMatchId = sorted.length > 0 ? sorted[0].id : null;

  return (
    <div className="fp-page">
      {/* Page header */}
      <div className="fp-header">
        <h1 className="fp-title">
          <span className="fp-title-icon" style={{ background: ACCENT }}>
            <Search size={22} strokeWidth={2.5} />
          </span>
          Find Partners
        </h1>
        <p className="fp-subtitle">Discover athletes who match your fitness goals, schedule, and level.</p>
      </div>

      {/* AI banner */}
      <AISmartMatchBanner />

      {/* Filters */}
      <FilterCard
        filters={filters}
        setFilter={setFilter}
        onSearch={fetchAthletes}
        onReset={() => { reset(); }}
      />

      {/* Results */}
      {loading ? (
        <div className="fp-loading">Searching for athletes…</div>
      ) : sorted.length === 0 ? (
        <NoResults onReset={() => { reset(); fetchAthletes(); }} />
      ) : (
        <>
          <div className="fp-results-header">
            <div>
              <h2 className="fp-results-count">
                <span>{sorted.length}</span> match{sorted.length === 1 ? '' : 'es'}
              </h2>
              <p className="fp-results-sub">Sorted by compatibility</p>
            </div>
            <div className="fp-results-info">
              <Info size={13} />
              Compatibility based on goals, schedule &amp; level
            </div>
          </div>

          <div className="fp-grid">
            {sorted.map((a, i) => (
              <AthleteCard
                key={a.id}
                athlete={a}
                index={i}
                isTopMatch={a.id === topMatchId}
                sentRequest={sentRequests.has(a.id)}
                onSend={sendRequest}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FindPartners;
