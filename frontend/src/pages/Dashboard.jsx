import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Flag,
  MapPin,
  Timer,
  Ruler,
  CalendarDays,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { COUNTRY_FLAGS, getRaceDateTime, formatDateRangeLong } from "@/lib/f1-data";
import { useAuth } from "@/context/AuthContext";

const useCountdown = (targetMs) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetMs) return;

    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return timeLeft;
};

const CountdownBlock = ({ value, label, valueClassName = "" }) => (
  <div className="flex flex-col items-center">
    <div className="glass-card px-4 py-3 sm:px-6 sm:py-4 min-w-[64px] sm:min-w-[80px] text-center">
      <span className={`font-display text-2xl sm:text-4xl ${valueClassName}`}>
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">
      {label}
    </span>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [nextRace, setNextRace]     = useState(null);
  const [seasonOver, setSeasonOver] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { refreshUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("https://f1api.dev/api/2026")
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        const races = data.races ?? [];
        const now   = new Date();
        const next  = races.find(race => {
          const d = getRaceDateTime(race);
          return d && d > now;
        });
        if (next) setNextRace(next);
        else      setSeasonOver(true);
        setLoading(false);
      })
      .catch(() => { setSeasonOver(true); setLoading(false); });
  }, []);

  const raceDateTime = nextRace ? getRaceDateTime(nextRace) : null;
  const countdown    = useCountdown(raceDateTime?.getTime());

  const c         = nextRace?.circuit;
  const flag      = COUNTRY_FLAGS[c?.country] ?? "🏁";
  const gpName    = (nextRace?.raceName ?? c?.circuitName ?? "").toUpperCase();
  const dateRange = nextRace ? formatDateRangeLong(nextRace.schedule) : "";

  const circuitStats = c ? [
    c.numberOfLaps            && { icon: Timer, label: `${c.numberOfLaps} Laps`,                    sublabel: "Race Distance", iconClassName: "text-secondary" },
    c.circuitLength           && { icon: Ruler, label: `${Math.round(parseFloat(c.circuitLength))} km`, sublabel: "Track Length",  iconClassName: "text-primary"   },
    c.firstParticipationYear  && { icon: Flag,  label: `${c.firstParticipationYear}`, sublabel: "First GP",      iconClassName: "text-primary"   },
  ].filter(Boolean) : [];

  return (
    <div className="container mx-auto px-4 py-8">

        {/* ── Hero ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative glass-card p-6 sm:p-10 mb-8 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 400 200" className="w-full max-w-2xl" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M50,100 C50,50 100,20 150,30 C200,40 180,80 220,70 C260,60 280,30 320,50 C360,70 370,120 330,140 C290,160 250,130 210,140 C170,150 160,180 120,170 C80,160 50,150 50,100Z" />
            </svg>
          </div>

          <div className="relative z-10">
            {loading && (
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-44 rounded-full bg-muted/50" />
                <div className="h-10 w-80 rounded bg-muted/50" />
                <div className="h-4 w-64 rounded bg-muted/50" />
                <div className="flex gap-3 mt-6">
                  {[0, 1, 2].map(i => <div key={i} className="h-12 w-36 rounded-xl bg-muted/50" />)}
                </div>
              </div>
            )}

            {!loading && seasonOver && (
              <>
                <span className="px-3 py-1 rounded-full bg-muted/40 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Season Concluded
                </span>
                <h1 className="font-display text-3xl sm:text-5xl mt-4 mb-2">SEE YOU IN 2027</h1>
                <p className="text-sm text-muted-foreground">The 2026 Formula 1 season has come to an end.</p>
              </>
            )}

            {!loading && nextRace && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                    Next Race Weekend
                  </span>
                  <span className="text-2xl">{flag}</span>
                </div>

                <h1 className="font-display text-3xl sm:text-5xl mb-2">{gpName}</h1>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm mb-8">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {c?.city}, {c?.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" /> {dateRange}
                  </span>
                </div>

                {circuitStats.length > 0 && (
                  <div className="flex flex-wrap gap-4 mb-8">
                    {circuitStats.map((stat, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50">
                        <stat.icon className={`w-5 h-5 ${stat.iconClassName}`} />
                        <div>
                          <div className="text-sm font-semibold">{stat.label}</div>
                          <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.section>

        {/* ── Countdown ── */}
        {!seasonOver && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-widest uppercase">
              Lights Out In
            </h2>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <CountdownBlock value={countdown.days}    label="Days"  />
              <span className="font-display text-2xl sm:text-4xl pulse-colon mt-[-1.5rem]">:</span>
              <CountdownBlock value={countdown.hours}   label="Hours" />
              <span className="font-display text-2xl sm:text-4xl pulse-colon mt-[-1.5rem]">:</span>
              <CountdownBlock value={countdown.minutes} label="Mins"  />
              <span className="font-display text-2xl sm:text-4xl pulse-colon mt-[-1.5rem]">:</span>
              <CountdownBlock value={countdown.seconds} label="Secs" valueClassName="text-primary" />
            </div>
          </motion.section>
        )}

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            to="/predictions"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-display text-sm tracking-wider uppercase glow-red hover:brightness-110 transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            Make Your Predictions
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => navigate("/schedule")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass-card text-foreground font-display text-sm tracking-wider uppercase hover:bg-muted transition-all"
          >
            <CalendarDays className="w-5 h-5" />
            View Full Schedule
          </button>
        </motion.div>

        {/* ── Stats ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="glass-card p-6 hover-lift">
            <div className="text-sm text-muted-foreground mb-1">Points This Season</div>
            <div className="font-display text-3xl text-primary">
              {(user?.score ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total accumulated score</div>
          </div>
          <div className="glass-card p-6 hover-lift">
            <div className="text-sm text-muted-foreground mb-1">Make Your Pick</div>
            <div className="font-display text-3xl text-secondary">
              {nextRace ? (nextRace.raceName ?? "Next Race") : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Predictions open now</div>
          </div>
        </motion.section>

    </div>
  );
};

export default Dashboard;
