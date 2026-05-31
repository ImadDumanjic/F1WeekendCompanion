import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, User, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API = `${import.meta.env.VITE_API_URL}/api`;

const getRankStyle = (rank) => {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-muted-foreground";
};

const Leaderboard = () => {
  const { token, user } = useAuth();
  const [entries, setEntries]       = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/users/leaderboard?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        const entries = Array.isArray(data) ? data : (data.entries ?? []);
        setEntries(entries);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? entries.length);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load leaderboard.");
        setLoading(false);
      });
  }, [token, page]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-2 font-display text-3xl sm:text-4xl">LEADERBOARD</h1>
        <p className="mb-8 text-muted-foreground">
          Season 2026 Rankings{total > 0 && ` · ${total.toLocaleString()} competitors`}
        </p>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="glass-card h-16 animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="glass-card flex items-center gap-3 p-6 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="glass-card p-10 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No entries yet. Be the first to make a prediction!</p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <div className="space-y-3 mb-6">
              {entries.map((entry, index) => {
                const rank   = Number(entry.rank);
                const isUser = user && entry.id === user.id;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className={`glass-card flex items-center gap-4 p-4 sm:p-5 hover-lift ${
                      isUser ? "border-l-4 border-l-primary glow-red" : ""
                    }`}
                  >
                    <span
                      className={`w-10 text-center font-display text-xl sm:text-2xl ${getRankStyle(rank)}`}
                    >
                      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
                    </span>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className={`truncate font-semibold ${isUser ? "text-primary" : ""}`}>
                        {entry.username}
                        {isUser && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-display text-sm">
                      <Trophy className="h-4 w-4 text-podium-green" />
                      {Number(entry.score).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold glass-card hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <span className="font-display text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold glass-card hover:bg-muted transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Leaderboard;
