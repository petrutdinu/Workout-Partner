import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sharedWorkoutApi, userApi } from '../api';
import { io } from 'socket.io-client';
import './SharedWorkout.css';

const WS_URL = process.env.REACT_APP_WORKOUT_WS_URL || 'http://localhost:8002';

const emptyEx = () => ({ exercise_name: '', sets: '', reps: '', weight_kg: '', duration_sec: '' });

const Scoreboard = ({ side, label, isMe }) => (
  <div className={`scoreboard-side ${isMe ? 'me' : 'them'}`}>
    <div className="scoreboard-header">
      <span className="scoreboard-name">{label}</span>
      {isMe && <span className="scoreboard-you-badge">You</span>}
    </div>
    <div className="scoreboard-stats">
      <div className="stat-box">
        <span className="stat-val">{Math.round(side?.total_calories ?? 0)}</span>
        <span className="stat-lbl">kcal</span>
      </div>
      <div className="stat-box">
        <span className="stat-val">{side?.total_sets ?? 0}</span>
        <span className="stat-lbl">sets</span>
      </div>
      <div className="stat-box">
        <span className="stat-val">{side?.total_reps ?? 0}</span>
        <span className="stat-lbl">reps</span>
      </div>
      <div className="stat-box">
        <span className="stat-val">{Math.round(side?.total_volume ?? 0)}</span>
        <span className="stat-lbl">vol (kg)</span>
      </div>
    </div>
    <div className="exercise-list">
      {(side?.exercises ?? []).length === 0 ? (
        <p className="no-exercises">No exercises yet</p>
      ) : (
        <table className="ex-table">
          <thead>
            <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>kg</th><th>kcal</th></tr>
          </thead>
          <tbody>
            {side.exercises.map((ex, i) => (
              <tr key={ex.id || i}>
                <td>{ex.exercise_name}</td>
                <td>{ex.sets ?? '—'}</td>
                <td>{ex.reps ?? '—'}</td>
                <td>{ex.weight_kg ?? '—'}</td>
                <td>{ex.calories ? Math.round(ex.calories) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const SharedWorkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [hostUser, setHostUser] = useState(null);
  const [guestUser, setGuestUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exercise, setExercise] = useState(emptyEx());
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const socketRef = useRef(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await sharedWorkoutApi.getLeaderboard(id);
      setLeaderboard(res.data);
      setRoom(res.data.room);
    } catch {}
  }, [id]);

  // Load room + leaderboard on mount
  useEffect(() => {
    const init = async () => {
      try {
        await loadLeaderboard();
      } catch (e) {
        setError('Session not found.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadLeaderboard]);

  // Fetch usernames when room data arrives
  useEffect(() => {
    if (!room) return;
    if (room.host_id) userApi.getUserById(room.host_id).then(r => setHostUser(r.data?.username || r.data?.user?.username || 'Host')).catch(() => setHostUser('Host'));
    if (room.guest_id) userApi.getUserById(room.guest_id).then(r => setGuestUser(r.data?.username || r.data?.user?.username || 'Guest')).catch(() => setGuestUser('Guest'));
  }, [room?.host_id, room?.guest_id]);

  // Socket.IO — subscribe to live leaderboard updates
  useEffect(() => {
    if (!user?.id) return;
    const socket = io(WS_URL, { path: '/socket.io', transports: ['websocket'], query: { userId: user.id } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('joinRoom', id));
    socket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data);
      setRoom(data.room);
    });
    return () => { socket.emit('leaveRoom', id); socket.disconnect(); };
  }, [id, user?.id]);

  const handleJoin = async () => {
    try {
      await sharedWorkoutApi.join(id);
      await loadLeaderboard();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not join session.');
    }
  };

  const handleFinish = async () => {
    if (!window.confirm('End the session for both participants?')) return;
    try {
      await sharedWorkoutApi.finish(id);
      await loadLeaderboard();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not finish session.');
    }
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!exercise.exercise_name.trim()) return;
    setAdding(true);
    try {
      await sharedWorkoutApi.addExercise(id, {
        exercise_name: exercise.exercise_name,
        sets: exercise.sets ? parseInt(exercise.sets) : null,
        reps: exercise.reps ? parseInt(exercise.reps) : null,
        weight_kg: exercise.weight_kg ? parseFloat(exercise.weight_kg) : null,
        duration_sec: exercise.duration_sec ? parseInt(exercise.duration_sec) : null,
      });
      setExercise(emptyEx());
      setShowForm(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to log exercise.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading session...</div>;
  if (error && !room) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;

  const isHost = user?.id === room?.host_id;
  const isGuest = user?.id === room?.guest_id;
  const isParticipant = isHost || isGuest;
  const canJoin = !isParticipant && room?.status === 'pending';
  const isActive = room?.status === 'active';
  const isFinished = room?.status === 'finished';

  const myLeaderboard = isHost ? leaderboard?.host : leaderboard?.guest;
  const theirLeaderboard = isHost ? leaderboard?.guest : leaderboard?.host;
  const myLabel = isHost ? (hostUser || 'You') : (guestUser || 'You');
  const theirLabel = isHost ? (guestUser || 'Opponent') : (hostUser || 'Opponent');

  // Determine leader by calories
  const myScore = myLeaderboard?.total_calories ?? 0;
  const theirScore = theirLeaderboard?.total_calories ?? 0;
  const leading = myScore > theirScore ? 'you' : myScore < theirScore ? 'them' : 'tie';

  return (
    <div className="shared-workout-page">
      <div className="shared-header">
        <div>
          <button className="back-link" onClick={() => navigate('/shared-workouts')}>← Back</button>
          <h1>{room?.title}</h1>
          <span className={`badge status-badge status-${room?.status}`}>{room?.status}</span>
          <span className="badge badge-blue">{room?.workout_type}</span>
        </div>
        <div className="shared-header-actions">
          {canJoin && (
            <button className="btn btn-primary" onClick={handleJoin}>Join Session</button>
          )}
          {isParticipant && isActive && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(f => !f)}>
                {showForm ? 'Cancel' : '+ Log Exercise'}
              </button>
              <button className="btn btn-danger" onClick={handleFinish}>Finish</button>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {room?.status === 'pending' && !canJoin && (
        <div className="card waiting-card">
          <p>Waiting for your partner to join...</p>
          <div className="invite-box">
            <span>Share this session ID with your partner:</span>
            <code className="session-id">{id}</code>
            <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(id)}>Copy ID</button>
          </div>
        </div>
      )}

      {showForm && isActive && (
        <form className="card exercise-form" onSubmit={handleAddExercise}>
          <h3>Log Exercise</h3>
          <div className="form-row cols-3">
            <div className="form-group">
              <label>Exercise *</label>
              <input required value={exercise.exercise_name} onChange={e => setExercise(x => ({ ...x, exercise_name: e.target.value }))} placeholder="e.g. Bench Press" />
            </div>
            <div className="form-group">
              <label>Sets</label>
              <input type="number" min="1" value={exercise.sets} onChange={e => setExercise(x => ({ ...x, sets: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Reps</label>
              <input type="number" min="1" value={exercise.reps} onChange={e => setExercise(x => ({ ...x, reps: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" min="0" step="0.5" value={exercise.weight_kg} onChange={e => setExercise(x => ({ ...x, weight_kg: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Duration (sec)</label>
              <input type="number" min="0" value={exercise.duration_sec} onChange={e => setExercise(x => ({ ...x, duration_sec: e.target.value }))} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={adding}>{adding ? 'Logging...' : 'Log Exercise'}</button>
          </div>
        </form>
      )}

      {(isActive || isFinished) && leaderboard && (
        <>
          {isActive && (
            <div className={`lead-banner ${leading}`}>
              {leading === 'you' ? '🔥 You are leading!' : leading === 'them' ? '💪 Opponent is leading — catch up!' : "⚡ It's a tie!"}
            </div>
          )}
          {isFinished && (
            <div className={`lead-banner finished ${leading}`}>
              {leading === 'you' ? '🏆 You won!' : leading === 'them' ? '🥈 Opponent won this one.' : "🤝 It's a draw!"}
            </div>
          )}
          <div className="scoreboards">
            {isParticipant ? (
              <>
                <Scoreboard side={myLeaderboard} label={myLabel} isMe={true} />
                <div className="vs-divider">VS</div>
                <Scoreboard side={theirLeaderboard} label={theirLabel} isMe={false} />
              </>
            ) : (
              <>
                <Scoreboard side={leaderboard.host} label={hostUser || 'Host'} isMe={false} />
                <div className="vs-divider">VS</div>
                <Scoreboard side={leaderboard.guest} label={guestUser || 'Guest'} isMe={false} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SharedWorkout;
