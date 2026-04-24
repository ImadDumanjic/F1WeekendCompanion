import { motion } from "framer-motion";
import { Trophy, Target, User } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "SpeedDemon_42", points: 2840, accuracy: 78 },
  { rank: 2, name: "TurboFan_UK", points: 2710, accuracy: 75 },
  { rank: 3, name: "MonzaMaster", points: 2650, accuracy: 72 },
  { rank: 4, name: "PitStop_Pro", points: 2400, accuracy: 70 },
  { rank: 5, name: "ChequeredKing", points: 2280, accuracy: 69 },
  { rank: 6, name: "ApexHunter", points: 2150, accuracy: 67 },
  { rank: 7, name: "SlipstreamAce", points: 2020, accuracy: 65 },
  { rank: 8, name: "GripLord", points: 1980, accuracy: 64 },
  { rank: 9, name: "DownforceKid", points: 1870, accuracy: 62 },
  { rank: 10, name: "RaceCraft_99", points: 1750, accuracy: 60 },
  { rank: 11, name: "DRS_Zone", points: 1600, accuracy: 58 },
  { rank: 12, name: "You", points: 1250, accuracy: 68, isUser: true },
  { rank: 13, name: "PaddockVibes", points: 1180, accuracy: 55 },
  { rank: 14, name: "UndercutKing", points: 1050, accuracy: 52 },
  { rank: 15, name: "BoxBoxBox", points: 920, accuracy: 50 },
];

const getRankStyle = (rank) => {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-muted-foreground";
};

const Leaderboard = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 font-display text-3xl sm:text-4xl">
            LEADERBOARD
          </h1>
          <p className="mb-8 text-muted-foreground">Season 2026 Rankings</p>

          <div className="space-y-3">
            {leaderboardData.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className={`glass-card flex items-center gap-4 p-4 sm:p-5 hover-lift ${
                  entry.isUser ? "border-l-4 border-l-primary glow-red" : ""
                }`}
              >
                <span
                  className={`w-10 text-center font-display text-xl sm:text-2xl ${getRankStyle(
                    entry.rank,
                  )}`}
                >
                  {entry.rank <= 3
                    ? ["🥇", "🥈", "🥉"][entry.rank - 1]
                    : `#${entry.rank}`}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate font-semibold ${
                      entry.isUser ? "text-primary" : ""
                    }`}
                  >
                    {entry.name}{" "}
                    {entry.isUser && (
                      <span className="text-xs text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                    <Target className="h-4 w-4" />
                    {entry.accuracy}%
                  </div>
                  <div className="flex items-center gap-1 font-display text-sm">
                    <Trophy className="h-4 w-4 text-podium-green" />
                    {entry.points.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
    </div>
  );
};

export default Leaderboard;
