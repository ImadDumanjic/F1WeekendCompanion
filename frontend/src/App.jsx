import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import SelectFavoriteDriver from '@/pages/SelectFavoriteDriver';
import Dashboard from '@/pages/Dashboard';
import AISummary from '@/pages/AISummary';
import Leaderboard from '@/pages/Leaderboard';
import Predictions from '@/pages/Predictions';
import Profile from '@/pages/Profile';
import Schedule from '@/pages/Schedule';

export default function App() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/select-driver" element={<SelectFavoriteDriver />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai-summary" element={<AISummary />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/schedule" element={<Schedule />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
