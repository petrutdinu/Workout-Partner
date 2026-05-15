import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api';
import './Profile.css';

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'];
const WORKOUT_TYPES = ['gym', 'running', 'cycling', 'swimming', 'yoga', 'crossfit', 'hiking', 'boxing', 'calisthenics'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['morning', 'afternoon', 'evening', 'flexible'];

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    bio: '', age: '', gender: '', city: '',
    fitness_level: 'Beginner', primary_goal: 'general_fitness',
    workout_types: [], preferred_days: [], preferred_time: 'flexible',
    weight_kg: '', certifications: [], hourly_rate: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    userApi.getCurrentUser().then(res => {
      const u = res.data;
      setForm({
        bio: u.bio || '',
        age: u.age || '',
        gender: u.gender || '',
        city: u.city || '',
        fitness_level: u.fitness_level || 'Beginner',
        primary_goal: u.primary_goal || 'general_fitness',
        workout_types: u.workout_types || [],
        preferred_days: u.preferred_days || [],
        preferred_time: u.preferred_time || 'flexible',
        weight_kg: u.weight_kg || '',
        certifications: u.certifications || [],
        hourly_rate: u.hourly_rate || ''
      });
    }).catch(() => {});
  }, []);

  const toggleArray = (field, value) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(x => x !== value)
        : [...f[field], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null
      };
      await userApi.updateFitnessProfile(payload);
      setMessage({ type: 'success', text: 'Profile saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Fitness Profile</h1>
      <p className="profile-subtitle">Complete your profile to enable AI matching</p>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className="profile-form card">
        <div className="form-section">
          <h2>Basic Info</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Bio</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} placeholder="Tell others about yourself..." />
            </div>
          </div>
          <div className="form-row cols-3">
            <div className="form-group">
              <label>Age</label>
              <input type="number" min="10" max="100" value={form.age} onChange={e => setForm(f => ({...f, age: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>City</label>
              <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="e.g. Bucharest" />
            </div>
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" min="30" max="300" step="0.5" value={form.weight_kg} onChange={e => setForm(f => ({...f, weight_kg: e.target.value}))} placeholder="Used for calorie calculations" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Fitness Details</h2>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Fitness Level</label>
              <select value={form.fitness_level} onChange={e => setForm(f => ({...f, fitness_level: e.target.value}))}>
                {FITNESS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Primary Goal</label>
              <select value={form.primary_goal} onChange={e => setForm(f => ({...f, primary_goal: e.target.value}))}>
                {GOALS.map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Workout Types</label>
            <div className="chip-group">
              {WORKOUT_TYPES.map(t => (
                <button key={t} type="button"
                  className={`chip ${form.workout_types.includes(t) ? 'active' : ''}`}
                  onClick={() => toggleArray('workout_types', t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Preferred Days</label>
            <div className="chip-group">
              {DAYS.map(d => (
                <button key={d} type="button"
                  className={`chip ${form.preferred_days.includes(d) ? 'active' : ''}`}
                  onClick={() => toggleArray('preferred_days', d)}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Preferred Time</label>
            <div className="chip-group">
              {TIMES.map(t => (
                <button key={t} type="button"
                  className={`chip ${form.preferred_time === t ? 'active' : ''}`}
                  onClick={() => setForm(f => ({...f, preferred_time: t}))}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {user?.isTrainer && (
          <div className="form-section">
            <h2>Trainer Info</h2>
            <div className="form-row cols-2">
              <div className="form-group">
                <label>Certifications (comma-separated)</label>
                <input value={form.certifications.join(', ')}
                  onChange={e => setForm(f => ({...f, certifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))}
                  placeholder="e.g. NASM-CPT, ACE, CSCS" />
              </div>
              <div className="form-group">
                <label>Hourly Rate (EUR)</label>
                <input type="number" min="0" step="5" value={form.hourly_rate}
                  onChange={e => setForm(f => ({...f, hourly_rate: e.target.value}))} />
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
