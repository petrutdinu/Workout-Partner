import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi } from '../api';
import {
  CalendarClock, Clock, Flame, Zap, Eye, Dumbbell,
  Layers, Repeat, Weight, Timer, Trash2, Plus,
  CheckCircle2, ChevronLeft, Info,
} from 'lucide-react';
import './WorkoutForm.css';

const WORKOUT_TYPES = ['gym', 'running', 'cycling', 'swimming', 'yoga', 'crossfit', 'hiking', 'boxing', 'calisthenics', 'other'];

const MUSCLE_GROUPS = [
  { value: '',           label: 'None / General' },
  { value: 'chest',      label: 'Chest' },
  { value: 'back',       label: 'Back' },
  { value: 'legs',       label: 'Legs' },
  { value: 'shoulders',  label: 'Shoulders' },
  { value: 'arms',       label: 'Arms' },
  { value: 'core',       label: 'Core / Abs' },
  { value: 'cardio',     label: 'Cardio' },
  { value: 'full body',  label: 'Full Body' },
];

const emptyExercise = () => ({
  id: Date.now() + Math.random(),
  exercise_name: '', sets: '', reps: '', weight_kg: '', duration_sec: ''
});

// ── Small reusables ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <label className="wf-label">
      {children}
      {required && <span className="wf-label-req">*</span>}
    </label>
  );
}

function SectionHeader({ icon: Icon, title, right }) {
  return (
    <div className="wf-section-header">
      <div className="wf-section-header-left">
        <span className="wf-section-icon">
          <Icon size={18} strokeWidth={2.25} />
        </span>
        <span className="wf-section-title">{title}</span>
      </div>
      {right}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`wf-toggle ${value ? 'wf-toggle--on' : ''}`}
    >
      <span className="wf-toggle-thumb" />
    </button>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────

const EXERCISE_FIELDS = [
  { key: 'sets',        label: 'Sets',     Icon: Layers, unit: ''    },
  { key: 'reps',        label: 'Reps',     Icon: Repeat, unit: ''    },
  { key: 'weight_kg',   label: 'Weight',   Icon: Weight, unit: 'kg'  },
  { key: 'duration_sec',label: 'Duration', Icon: Timer,  unit: 'sec' },
];

function ExerciseCard({ ex, idx, onChange, onRemove, canRemove, isNew }) {
  return (
    <div className={`wf-exercise-card ${isNew ? 'wf-exercise-card--enter' : ''}`}>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="wf-remove-btn"
        aria-label="Remove exercise"
      >
        <Trash2 size={18} strokeWidth={2.25} />
      </button>

      <div className="wf-exercise-name-wrap">
        <FieldLabel>Exercise</FieldLabel>
        <input
          className="wf-field wf-field--name"
          placeholder="e.g. Bench Press"
          value={ex.exercise_name}
          onChange={e => onChange('exercise_name', e.target.value)}
        />
      </div>

      <div className="wf-exercise-metrics">
        {EXERCISE_FIELDS.map(({ key, label, Icon: FieldIcon, unit }) => (
          <div key={key} className="wf-metric-group">
            <label className="wf-metric-label">
              {label}
              {unit && <span className="wf-metric-unit">({unit})</span>}
            </label>
            <div className="wf-metric-input-wrap">
              <FieldIcon size={14} className="wf-metric-icon" />
              <input
                type="number"
                min="0"
                className="wf-field wf-field--sm wf-field--metric"
                placeholder="0"
                value={ex[key]}
                onChange={e => onChange(key, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

const WorkoutForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    workout_type: 'gym',
    muscle_group: '',
    duration_minutes: '',
    notes: '',
    is_public: true,
  });
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [newIds, setNewIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [calorieEst, setCalorieEst] = useState(null);

  const setF = patch => setForm(f => ({ ...f, ...patch }));

  const updateExercise = (id, field, value) =>
    setExercises(exs => exs.map(e => e.id === id ? { ...e, [field]: value } : e));

  const addExercise = () => {
    const ex = emptyExercise();
    setExercises(exs => [...exs, ex]);
    setNewIds(s => new Set([...s, ex.id]));
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(ex.id); return n; }), 300);
  };

  const removeExercise = id => setExercises(exs => exs.filter(e => e.id !== id));

  const estimateCalories = async () => {
    if (!form.workout_type || !form.duration_minutes) return;
    try {
      const res = await workoutApi.estimateCalories({
        workout_type: form.workout_type,
        duration_minutes: parseInt(form.duration_minutes),
      });
      setCalorieEst(res.data?.estimated_calories);
    } catch {}
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const sessionRes = await workoutApi.createSession({
        ...form,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      });
      const sessionId = sessionRes.data?.id || sessionRes.data?.session?.id;
      const validExercises = exercises.filter(ex => ex.exercise_name.trim());
      for (const ex of validExercises) {
        await workoutApi.addExercise(sessionId, {
          exercise_name: ex.exercise_name,
          sets:         ex.sets         ? parseInt(ex.sets)          : null,
          reps:         ex.reps         ? parseInt(ex.reps)          : null,
          weight_kg:    ex.weight_kg    ? parseFloat(ex.weight_kg)   : null,
          duration_sec: ex.duration_sec ? parseInt(ex.duration_sec)  : null,
        });
      }
      navigate(`/workouts/${sessionId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save workout.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.title.trim() && exercises.some(e => e.exercise_name.trim());

  return (
    <div className="wf-page">
      {/* Page header */}
      <div className="wf-page-header">
        <button type="button" className="wf-back-link" onClick={() => navigate('/workouts')}>
          <ChevronLeft size={15} />
          Back to workouts
        </button>
        <div className="wf-title-row">
          <div>
            <h1 className="wf-title">Log Workout</h1>
            <p className="wf-subtitle">Track your session. Sets, reps, calories — log it once, see your progress forever.</p>
          </div>
        </div>
      </div>

      {error && <div className="wf-error">{error}</div>}

      <form onSubmit={handleSubmit} className="wf-form">
        {/* ── Session Details ── */}
        <section className="wf-card">
          <SectionHeader icon={CalendarClock} title="Session Details" />

          <div className="wf-grid-2">
            <div>
              <FieldLabel required>Title</FieldLabel>
              <input
                className="wf-field"
                placeholder="e.g. Morning Chest Day"
                value={form.title}
                onChange={e => setF({ title: e.target.value })}
                required
              />
            </div>
            <div>
              <FieldLabel>Workout Type</FieldLabel>
              <select
                className="wf-field wf-field--select"
                value={form.workout_type}
                onChange={e => setF({ workout_type: e.target.value })}
              >
                {WORKOUT_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Muscle Group</FieldLabel>
              <select
                className="wf-field wf-field--select"
                value={form.muscle_group}
                onChange={e => setF({ muscle_group: e.target.value })}
              >
                {MUSCLE_GROUPS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Duration (minutes)</FieldLabel>
              <div className="wf-duration-row">
                <div className="wf-duration-input-wrap">
                  <Clock size={16} className="wf-input-icon" />
                  <input
                    type="number"
                    min="1"
                    max="600"
                    className="wf-field wf-field--icon-left"
                    placeholder="45"
                    value={form.duration_minutes}
                    onChange={e => setF({ duration_minutes: e.target.value })}
                  />
                </div>
                <button type="button" className="wf-estimate-btn" onClick={estimateCalories}>
                  <Flame size={15} strokeWidth={2.5} />
                  Estimate
                </button>
                {calorieEst != null && (
                  <div className="wf-kcal-chip">
                    <Zap size={14} strokeWidth={2.5} />
                    ~{calorieEst} kcal
                  </div>
                )}
              </div>
            </div>
            <div>
              <FieldLabel>Notes</FieldLabel>
              <input
                className="wf-field"
                placeholder="Optional notes…"
                value={form.notes}
                onChange={e => setF({ notes: e.target.value })}
              />
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="wf-visibility">
            <Toggle value={form.is_public} onChange={v => setF({ is_public: v })} />
            <div className="wf-visibility-body">
              <div className="wf-visibility-label">
                <Eye size={15} className="wf-visibility-icon" />
                Make this session visible to partners
              </div>
              <div className="wf-visibility-hint">
                Your partners can see this workout in real time and cheer you on.
              </div>
            </div>
          </div>
        </section>

        {/* ── Exercises ── */}
        <section className="wf-card">
          <SectionHeader
            icon={Dumbbell}
            title="Exercises"
            right={
              <span className="wf-exercise-count">
                {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
              </span>
            }
          />

          <div className="wf-exercise-list">
            {exercises.map((ex, idx) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                idx={idx}
                onChange={(field, value) => updateExercise(ex.id, field, value)}
                onRemove={() => removeExercise(ex.id)}
                canRemove={exercises.length > 1}
                isNew={newIds.has(ex.id)}
              />
            ))}

            <button type="button" className="wf-add-exercise-btn" onClick={addExercise}>
              <Plus size={16} strokeWidth={2.5} />
              Add Exercise
            </button>
          </div>
        </section>

        {/* ── Bottom action bar ── */}
        <div className="wf-action-bar">
          <button
            type="button"
            className="wf-cancel-btn"
            onClick={() => navigate('/workouts')}
          >
            Cancel
          </button>
          {!isValid && (
            <span className="wf-hint">
              <Info size={14} />
              Add a title and at least one named exercise to save.
            </span>
          )}
          <button
            type="submit"
            className="wf-save-btn"
            disabled={!isValid || saving}
          >
            <CheckCircle2 size={16} strokeWidth={2.5} />
            {saving ? 'Saving…' : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutForm;
