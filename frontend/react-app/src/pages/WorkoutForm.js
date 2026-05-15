import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutApi } from '../api';
import './WorkoutForm.css';

const WORKOUT_TYPES = ['gym', 'running', 'cycling', 'swimming', 'yoga', 'crossfit', 'hiking', 'boxing', 'calisthenics', 'other'];

const emptyExercise = () => ({
  exercise_name: '', sets: '', reps: '', weight_kg: '', duration_sec: ''
});

const WorkoutForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    workout_type: 'gym',
    duration_minutes: '',
    notes: '',
    is_public: true
  });
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [calorieEst, setCalorieEst] = useState(null);

  const updateExercise = (idx, field, value) => {
    setExercises(exs => exs.map((e, i) => i === idx ? {...e, [field]: value} : e));
  };

  const addExercise = () => setExercises(exs => [...exs, emptyExercise()]);
  const removeExercise = (idx) => setExercises(exs => exs.filter((_, i) => i !== idx));

  const estimateCalories = async () => {
    if (!form.workout_type || !form.duration_minutes) return;
    try {
      const res = await workoutApi.estimateCalories({
        workout_type: form.workout_type,
        duration_minutes: parseInt(form.duration_minutes)
      });
      setCalorieEst(res.data?.estimated_calories);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const sessionRes = await workoutApi.createSession({
        ...form,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null
      });
      const sessionId = sessionRes.data?.id || sessionRes.data?.session?.id;
      const validExercises = exercises.filter(ex => ex.exercise_name.trim());
      for (const ex of validExercises) {
        await workoutApi.addExercise(sessionId, {
          exercise_name: ex.exercise_name,
          sets: ex.sets ? parseInt(ex.sets) : null,
          reps: ex.reps ? parseInt(ex.reps) : null,
          weight_kg: ex.weight_kg ? parseFloat(ex.weight_kg) : null,
          duration_sec: ex.duration_sec ? parseInt(ex.duration_sec) : null
        });
      }
      navigate(`/workouts/${sessionId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save workout.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Log Workout</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="workout-form card">
        <div className="form-section">
          <h2>Session Details</h2>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Morning Chest Day" />
            </div>
            <div className="form-group">
              <label>Workout Type</label>
              <select value={form.workout_type} onChange={e => setForm(f => ({...f, workout_type: e.target.value}))}>
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Duration (minutes)</label>
              <div className="input-with-btn">
                <input type="number" min="1" max="600" value={form.duration_minutes}
                  onChange={e => setForm(f => ({...f, duration_minutes: e.target.value}))} />
                <button type="button" className="btn btn-secondary" onClick={estimateCalories}>Estimate Calories</button>
              </div>
              {calorieEst && <p className="calorie-est">Estimated: ~{calorieEst} kcal</p>}
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Optional notes..." />
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({...f, is_public: e.target.checked}))} />
              Make this session visible to partners
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Exercises</h2>
            <button type="button" className="btn btn-secondary" onClick={addExercise}>+ Add Exercise</button>
          </div>
          {exercises.map((ex, idx) => (
            <div key={idx} className="exercise-row">
              <div className="exercise-fields">
                <div className="form-group">
                  <label>Exercise Name</label>
                  <input value={ex.exercise_name} onChange={e => updateExercise(idx, 'exercise_name', e.target.value)} placeholder="e.g. Bench Press" />
                </div>
                <div className="form-group">
                  <label>Sets</label>
                  <input type="number" min="1" value={ex.sets} onChange={e => updateExercise(idx, 'sets', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Reps</label>
                  <input type="number" min="1" value={ex.reps} onChange={e => updateExercise(idx, 'reps', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" min="0" step="0.5" value={ex.weight_kg} onChange={e => updateExercise(idx, 'weight_kg', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Duration (sec)</label>
                  <input type="number" min="0" value={ex.duration_sec} onChange={e => updateExercise(idx, 'duration_sec', e.target.value)} />
                </div>
              </div>
              {exercises.length > 1 && (
                <button type="button" className="btn-remove" onClick={() => removeExercise(idx)}>×</button>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/workouts')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutForm;
