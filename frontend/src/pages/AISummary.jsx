import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Trophy,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Flag,
  ChevronUp,
  ChevronDown,
  Minus,
  Check,
  X,
} from "lucide-react";
import { COUNTRY_FLAGS } from "@/lib/f1-data";
import { fetchRaceSummary, fetchPersonalRecap } from "@/services/raceSummaryService";

const TEAM_COLORS = {
  "Red Bull":                      "#3671C6",
  "Red Bull Racing Honda RBPT":    "#3671C6",
  Ferrari:                         "#E8002D",
  McLaren:                         "#FF8000",
  Mercedes:                        "#27F4D2",
  "Aston Martin Aramco Mercedes":  "#229971",
  "Aston Martin":                  "#229971",
  Williams:                        "#64C4FF",
  Haas:                            "#B6BABD",
  Alpine:                          "#FF87BC",
  "Kick Sauber Ferrari":           "#52E252",
  Sauber:                          "#52E252",
  RB:                              "#6692FF",
  "Racing Bulls":                  "#6692FF",
};

const KEY_MOMENT_ICONS = [Trophy, Zap, AlertTriangle];

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock = ({ h = "h-4", w = "w-full", className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-muted/60 ${h} ${w} ${className}`} />
);

const SummarySkeleton = () => (
  <div className="space-y-6">
    <div className="glass-card p-6 sm:p-8 space-y-4">
      <SkeletonBlock h="h-8" w="w-3/4" />
      <SkeletonBlock h="h-4" w="w-1/3" />
    </div>
    <div className="glass-card p-6 sm:p-8 space-y-3">
      <SkeletonBlock h="h-4" />
      <SkeletonBlock h="h-4" w="w-5/6" />
      <SkeletonBlock h="h-4" w="w-4/5" />
      <SkeletonBlock h="h-4" w="w-3/4" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-card p-4 space-y-2">
          <SkeletonBlock h="h-5" w="w-5" />
          <SkeletonBlock h="h-3" />
          <SkeletonBlock h="h-3" w="w-4/5" />
        </div>
      ))}
    </div>
  </div>
);

// ── Race chip ─────────────────────────────────────────────────────────────────

const RaceChip = ({ race, selected, onClick }) => {
  const flag = COUNTRY_FLAGS[race.circuit?.country] ?? "🏁";
  const name = (race.raceName ?? "").replace(" Grand Prix", " GP");
  return (
    <button
      onClick={onClick}
      className={[
        "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-150 text-center",
        selected
          ? "border-primary bg-primary/15 text-primary"
          : "border-glass-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
      ].join(" ")}
    >
      <span className="text-lg leading-none">{flag}</span>
      <span className="font-display text-[10px] leading-snug whitespace-nowrap">
        R{String(race.round).padStart(2, "0")}
      </span>
      <span className="text-[9px] leading-snug max-w-[60px] text-center opacity-70 line-clamp-2">
        {name}
      </span>
    </button>
  );
};

// ── Breakdown row ─────────────────────────────────────────────────────────────

const PREDICTION_LABELS = {
  podium_p1:   "P1 Winner",
  podium_p2:   "P2 Place",
  podium_p3:   "P3 Place",
  fastest_lap: "Fastest Lap",
  safety_cars: "Safety Cars",
};

const BreakdownRow = ({ item }) => {
  const isHit    = item.hit === true;
  const isClose  = item.hit === "close";
  const isMiss   = item.hit === false;
  const isSC     = item.type === "safety_cars";

  return (
    <div className={[
      "flex items-center justify-between py-2.5 border-b border-glass-border last:border-0 gap-3",
    ].join(" ")}>
      <span className="text-sm text-muted-foreground w-24 shrink-0">
        {PREDICTION_LABELS[item.type] ?? item.type}
      </span>
      <div className="flex items-center gap-3 flex-1 justify-end">
        <span className={`text-sm font-mono font-semibold ${isSC ? "text-foreground" : "text-foreground"}`}>
          {isSC ? item.predicted : item.predicted}
        </span>
        <span className="text-muted-foreground/40 text-xs">→</span>
        <span className="text-sm font-mono">
          {isSC ? item.actual : item.actual}
        </span>
        <div className={[
          "flex items-center gap-1 text-xs font-semibold min-w-[48px] justify-end",
          isHit   ? "text-success"          : "",
          isClose ? "text-yellow-400"       : "",
          isMiss  ? "text-muted-foreground" : "",
        ].join(" ")}>
          {isHit  && <><Check className="h-3 w-3" />{item.points}pts</>}
          {isClose && <><Minus className="h-3 w-3" />{item.points}pts</>}
          {isMiss && <><X className="h-3 w-3" />0pts</>}
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const AISummary = () => {
  const [races, setRaces]               = useState([]);
  const [racesLoading, setRacesLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);

  const [summary, setSummary]           = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [notFinished, setNotFinished]   = useState(false);

  const [personal, setPersonal]         = useState(null);

  // Fetch completed races from f1api.dev
  useEffect(() => {
    const now = new Date();
    fetch("https://f1api.dev/api/2026")
      .then((r) => r.json())
      .then((data) => {
        const completed = (data.races ?? []).filter((race) => {
          const d = race.schedule?.race?.date;
          return d && new Date(d) < now;
        });
        setRaces(completed);
        if (completed.length > 0) {
          setSelectedRace(completed[completed.length - 1]);
        }
        setRacesLoading(false);
      })
      .catch(() => setRacesLoading(false));
  }, []);

  const loadSummary = useCallback(async (race) => {
    if (!race) return;
    setSummary(null);
    setPersonal(null);
    setSummaryError(null);
    setNotFinished(false);
    setSummaryLoading(true);

    try {
      const data = await fetchRaceSummary(2026, race.round);
      if (data?.notFinished) {
        setNotFinished(true);
      } else if (data) {
        setSummary(data);
        // load personal recap in parallel (non-blocking)
        fetchPersonalRecap(2026, race.round)
          .then((p) => { if (p) setPersonal(p); })
          .catch(() => {});
      } else {
        setSummaryError("Couldn't load summary.");
      }
    } catch {
      setSummaryError("Couldn't load summary. Try again later.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRace) loadSummary(selectedRace);
  }, [selectedRace, loadSummary]);

  const raceName = selectedRace
    ? (selectedRace.raceName ?? "").replace(" Grand Prix", " GP")
    : "";
  const raceDate = selectedRace?.schedule?.race?.date ?? "";
  const flag     = selectedRace ? (COUNTRY_FLAGS[selectedRace.circuit?.country] ?? "🏁") : "";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-2 flex items-center gap-3">
          <Brain className="h-8 w-8 text-secondary" />
          <h1 className="font-display text-3xl sm:text-4xl">POST-RACE ANALYSIS</h1>
        </div>
        <p className="mb-6 text-muted-foreground text-sm">
          AI-powered race recaps — powered by Groq · Llama 3.3
        </p>

        {/* Race selector */}
        {!racesLoading && races.length > 0 && (
          <div className="mb-8">
            <p className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-3">
              Select Race
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {races.map((race) => (
                <RaceChip
                  key={race.round}
                  race={race}
                  selected={selectedRace?.round === race.round}
                  onClick={() => setSelectedRace(race)}
                />
              ))}
            </div>
          </div>
        )}

        {racesLoading && (
          <div className="mb-8 flex gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[76px] w-[72px] flex-shrink-0 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        )}

        {!racesLoading && races.length === 0 && (
          <div className="glass-card mb-8 p-8 text-center">
            <Flag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No completed races yet this season.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Come back after the first race ends.
            </p>
          </div>
        )}

        {/* States */}
        <AnimatePresence mode="wait">
          {summaryLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SummarySkeleton />
            </motion.div>
          )}

          {!summaryLoading && notFinished && (
            <motion.div
              key="not-finished"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 text-center"
            >
              <Flag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-display text-lg mb-2">RECAP INCOMING</p>
              <p className="text-muted-foreground text-sm">
                Recap available a few hours after the race ends.
              </p>
            </motion.div>
          )}

          {!summaryLoading && summaryError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 text-center"
            >
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{summaryError}</p>
              <button
                onClick={() => loadSummary(selectedRace)}
                className="mt-4 px-4 py-2 rounded-xl bg-muted/60 text-sm hover:bg-muted transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}

          {!summaryLoading && summary && (
            <motion.div
              key={summary.raceId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              {/* Hero */}
              <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] flex items-end justify-end pointer-events-none pr-6 pb-3">
                  <span className="font-display text-[8rem] leading-none select-none">
                    {flag}
                  </span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-display text-xs tracking-widest text-primary uppercase">
                      Round {summary.raceRound} · {raceDate}
                    </span>
                    <span className="text-lg">{flag}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl leading-tight mb-1">
                    {summary.headline}
                  </h2>
                  <p className="text-sm text-muted-foreground">{raceName}</p>
                </div>
              </div>

              {/* Story */}
              <div className="glass-card p-6 sm:p-8">
                <p className="text-[17px] leading-[1.75] text-foreground/90">
                  {summary.story}
                </p>
                <p className="mt-4 font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                  Generated by Groq · Llama 3.3
                </p>
              </div>

              {/* Key Moments */}
              <div>
                <p className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-3">
                  Key Moments
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {summary.keyMoments.slice(0, 3).map((moment, i) => {
                    const Icon = KEY_MOMENT_ICONS[i] ?? Flag;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="glass-card p-4 flex gap-3"
                      >
                        <div className="mt-0.5 shrink-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">{moment}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Championship Impact */}
              <div className="glass-card p-5 flex gap-4 items-start">
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-display text-xs tracking-widest text-secondary uppercase mb-1.5">
                    Championship Impact
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {summary.championshipImpact}
                  </p>
                </div>
              </div>

              {/* Driver of the Day */}
              <DriverOfTheDayCard driverOfTheDay={summary.driverOfTheDay} />

              {/* Personal Recap */}
              {personal && !personal.notPredicted && <PersonalRecap personal={personal} />}
              {personal?.notPredicted && <NoPredictionNotice />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ── Driver of the Day ─────────────────────────────────────────────────────────

function DriverOfTheDayCard({ driverOfTheDay }) {
  const name       = driverOfTheDay?.name ?? "";
  const reason     = driverOfTheDay?.reason ?? "";
  const lastName   = name.split(" ").pop() ?? name;
  const initials   = name.split(" ").map((p) => p[0]).join("").slice(0, 2);

  // Try to guess team color from name (not perfect, but best we can do without team data)
  const glowColor  = "hsl(var(--secondary))";

  return (
    <div>
      <p className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-3">
        Driver of the Day
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 flex items-center gap-5"
        style={{ boxShadow: `0 0 24px 0 ${glowColor}22` }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted font-display text-2xl"
          style={{ boxShadow: `0 0 0 3px ${glowColor}66` }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl sm:text-2xl">{lastName.toUpperCase()}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{name}</p>
          <p className="text-sm text-secondary mt-2 leading-snug italic">
            "{reason}"
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── No Prediction Notice ──────────────────────────────────────────────────────

function NoPredictionNotice() {
  return (
    <div>
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 border-t border-glass-border" />
        <span className="font-display text-xs tracking-widest text-muted-foreground uppercase">
          Your Race
        </span>
        <div className="flex-1 border-t border-glass-border" />
      </div>
      <div className="glass-card p-6 text-center">
        <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          You didn't submit a prediction for this race.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Head to Predictions before the next race to compete.
        </p>
      </div>
    </div>
  );
}

// ── Personal Recap ────────────────────────────────────────────────────────────

function PersonalRecap({ personal }) {
  const { totalPoints, breakdown, rankBefore, rankAfter, rankDelta } = personal;

  return (
    <div>
      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 border-t border-glass-border" />
        <span className="font-display text-xs tracking-widest text-muted-foreground uppercase">
          Your Race
        </span>
        <div className="flex-1 border-t border-glass-border" />
      </div>

      {/* Points + rank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="glass-card p-5 text-center border-primary/20">
          <p className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-1">
            Points Scored
          </p>
          <p className="font-display text-5xl text-primary">{totalPoints}</p>
          <p className="text-xs text-muted-foreground mt-1">this race</p>
        </div>

        <div className="glass-card p-5 text-center">
          <p className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-1">
            Rank Change
          </p>
          {rankDelta != null ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <span className="font-display text-3xl text-muted-foreground">#{rankBefore}</span>
                <span className={[
                  "flex items-center gap-0.5 font-display text-2xl",
                  rankDelta > 0 ? "text-success" : rankDelta < 0 ? "text-destructive" : "text-muted-foreground",
                ].join(" ")}>
                  {rankDelta > 0 && <ChevronUp className="h-5 w-5" />}
                  {rankDelta < 0 && <ChevronDown className="h-5 w-5" />}
                  {rankDelta === 0 && <Minus className="h-5 w-5" />}
                  {Math.abs(rankDelta)}
                </span>
                <span className="font-display text-3xl">#{rankAfter}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {rankDelta > 0 ? `Moved up ${rankDelta} places` : rankDelta < 0 ? `Dropped ${Math.abs(rankDelta)} places` : "Held position"}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm mt-2">Rank unavailable</p>
          )}
        </div>
      </div>

      {/* Breakdown table */}
      <div className="glass-card p-5">
        <p className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-3">
          Prediction Breakdown
        </p>
        <div>
          {breakdown.map((item) => (
            <BreakdownRow key={item.type} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AISummary;
