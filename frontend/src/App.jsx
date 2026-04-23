import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/select-driver" element={
        <ProtectedRoute><SelectFavoriteDriver /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/ai-summary" element={
        <ProtectedRoute><AISummary /></ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute><Leaderboard /></ProtectedRoute>
      } />
      <Route path="/predictions" element={
        <ProtectedRoute><Predictions /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/schedule" element={
        <ProtectedRoute><Schedule /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
