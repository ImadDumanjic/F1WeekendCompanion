import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import AISummary from "@/pages/AISummary";
import Leaderboard from "@/pages/Leaderboard";
import Predictions from "@/pages/Predictions";
import Profile from "@/pages/Profile";
import Schedule from "@/pages/Schedule";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/ai-summary" element={<AISummary />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/predictions" element={<Predictions />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/schedule" element={<Schedule />} />
    </Routes>
  );
}
