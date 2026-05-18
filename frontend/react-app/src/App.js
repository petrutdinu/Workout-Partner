import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import WorkoutLog from './pages/WorkoutLog';
import WorkoutForm from './pages/WorkoutForm';
import WorkoutDetail from './pages/WorkoutDetail';
import PartnerWorkouts from './pages/PartnerWorkouts';
import FindPartners from './pages/FindPartners';
import SmartMatch from './pages/SmartMatch';
import PartnerList from './pages/PartnerList';
import Progress from './pages/Progress';
import Chat from './pages/Chat';
import SharedWorkoutList from './pages/SharedWorkoutList';
import SharedWorkout from './pages/SharedWorkout';
import GymMap from './pages/GymMap';
import TrainerDirectory from './pages/TrainerDirectory';
import PublicProfile from './pages/PublicProfile';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="app">
      {!isLanding && <Header />}
      <main className={isLanding ? '' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><WorkoutLog /></ProtectedRoute>} />
          <Route path="/workouts/new" element={<ProtectedRoute><WorkoutForm /></ProtectedRoute>} />
          <Route path="/workouts/:id" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
          <Route path="/workouts/partner/:userId" element={<ProtectedRoute><PartnerWorkouts /></ProtectedRoute>} />
          <Route path="/partners/find" element={<ProtectedRoute><FindPartners /></ProtectedRoute>} />
          <Route path="/partners/match" element={<ProtectedRoute><SmartMatch /></ProtectedRoute>} />
          <Route path="/partners" element={<ProtectedRoute><PartnerList /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/shared-workouts" element={<ProtectedRoute><SharedWorkoutList /></ProtectedRoute>} />
          <Route path="/shared-workouts/:id" element={<ProtectedRoute><SharedWorkout /></ProtectedRoute>} />
          <Route path="/gyms" element={<ProtectedRoute><GymMap /></ProtectedRoute>} />
          <Route path="/trainers" element={<ProtectedRoute><TrainerDirectory /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isLanding && (
        <footer className="footer">
          <p>Workout Partner &copy; 2026</p>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
