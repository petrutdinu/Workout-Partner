import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { workoutApi } from '../api';
import './Progress.css';

const Progress = () => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      workoutApi.getSessions({ limit: 30 }),
      workoutApi.getMyStats()
    ]).then(([sessRes, statsRes]) => {
      const rawSessions = sessRes.data?.sessions || sessRes.data || [];
      setSessions(rawSessions.reverse());
      setStats(statsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const calorieSeries = sessions
    .filter(s => s.total_calories && s.started_at)
    .map(s => ({
      date: new Date(s.started_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      calories: Math.round(s.total_calories)
    }));

  const durationSeries = sessions
    .filter(s => s.duration_minutes && s.started_at)
    .map(s => ({
      date: new Date(s.started_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      minutes: s.duration_minutes
    }));

  const typeFreq = sessions.reduce((acc, s) => {
    if (s.workout_type) acc[s.workout_type] = (acc[s.workout_type] || 0) + 1;
    return acc;
  }, {});
  const typeSeries = Object.entries(typeFreq).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="page-container">
      <h1>My Progress</h1>

      {stats && (
        <div className="progress-stats-grid">
          <div className="stat-card"><div className="stat-number">{stats.total_sessions ?? 0}</div><div className="stat-label">Sessions</div></div>
          <div className="stat-card"><div className="stat-number">{stats.total_calories ? Math.round(stats.total_calories) : 0}</div><div className="stat-label">Total Calories</div></div>
          <div className="stat-card"><div className="stat-number">{stats.total_duration_minutes ?? 0}</div><div className="stat-label">Minutes</div></div>
          <div className="stat-card"><div className="stat-number">{stats.avg_session_duration ? Math.round(stats.avg_session_duration) : 0}</div><div className="stat-label">Avg. Duration</div></div>
        </div>
      )}

      <div className="charts-grid">
        <div className="card">
          <h2>Calories Burned (last 30 sessions)</h2>
          {calorieSeries.length < 2 ? (
            <p className="chart-empty">Log more workouts to see this chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={calorieSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="calories" stroke="#e53935" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2>Session Duration (last 30 sessions)</h2>
          {durationSeries.length < 2 ? (
            <p className="chart-empty">Log more workouts to see this chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={durationSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#e53935" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2>Workout Type Breakdown</h2>
          {typeSeries.length === 0 ? (
            <p className="chart-empty">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeSeries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#e53935" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
