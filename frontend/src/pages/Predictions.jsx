import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Lock, Trophy, Zap, ShieldAlert, Check, AlertCircle,
  ChevronDown, ChevronLeft, ChevronRight, Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getCurrentDriverStandings } from "@/services/f1ApiService";
import { getRaceDateTime } from "@/lib/f1-data";

const API = `${import.meta.env.VITE_API_URL}/api`;
const RACE_YEAR = 2026;

const SC_OPTIONS = [
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4+", value: 4 },
];

const POINTS = { p1: 15, p2: 10, p3: 8, fastest_lap: 5, sc_exact: 5, sc_off1: 2 };

const NATIONALITY_FLAGS = {
  "Dutch":          "🇳🇱",
  "British":        "🇬🇧",
  "Monegasque":     "🇲🇨",
  "Spanish":        "🇪🇸",
  "Australian":     "🇦🇺",
  "French":         "🇫🇷",
  "Mexican":        "🇲🇽",
  "Canadian":       "🇨🇦",
  "Thai":           "🇹🇭",
  "Japanese":       "🇯🇵",
  "German":         "🇩🇪",
  "Finnish":        "🇫🇮",
  "Danish":         "🇩🇰",
  "American":       "🇺🇸",
  "Italian":        "🇮🇹",
  "Chinese":        "🇨🇳",
  "Brazilian":      "🇧🇷",
  "Argentinian":    "🇦🇷",
  "Argentine":      "🇦🇷",
  "Austrian":       "🇦🇹",
  "New Zealander":  "🇳🇿",
  "Polish":         "🇵🇱",
  "Swedish":        "🇸🇪",
  "Russian":        "🇷🇺",
  "Swiss":          "🇨🇭",
  "Belgian":        "🇧🇪",
  "Indonesian":     "🇮🇩",
  "Algerian":       "🇩🇿",
};

const DriverDropdown = ({ value, onChange, drivers, excluded, disabled }) => {
  const [open, setOpen]           = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef                 = useRef(null);
  const dropdownRef               = useRef(null);
  const selectedDriver            = value ? (drivers.find((d) => d.code === value) ?? null) : null;
  const available                 = drivers.filter((d) => !excluded.includes(d.code) || d.code === value);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      minWidth: Math.max(230, rect.width),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onMouse = (e) => {
      if (!buttonRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const onScroll = (e) => { if (!dropdownRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onMouse);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, updatePosition]);

  return (
    <div className="relative w-full max-w-[200px]">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-glass-border bg-muted px-3 py-2 text-sm text-left transition-colors hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selectedDriver ? (
          <>
            <span className="shrink-0 text-base leading-none">
              {NATIONALITY_FLAGS[selectedDriver.nationality] ?? "🏁"}
            </span>
            <span className="flex-1 truncate text-foreground">
              {selectedDriver.name.split(" ").slice(-1)[0]}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {selectedDriver.code}
            </span>
          </>
        ) : (
          <span className="flex-1 text-muted-foreground">Select driver</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="max-h-64 overflow-y-auto rounded-xl border border-glass-border bg-card/95 py-1 shadow-2xl backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            — None —
          </button>
          <div className="my-1 border-t border-glass-border/40" />
          {available.map((d) => (
            <button
              key={d.code}
              type="button"
              onClick={() => { onChange(d.code); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                d.code === value
                  ? "bg-primary/15 text-primary"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              <span className="shrink-0 text-base leading-none">
                {NATIONALITY_FLAGS[d.nationality] ?? "🏁"}
              </span>
              <span className="flex-1 truncate">{d.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {d.code}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const DriverSelect = ({ label, position, value, onChange, drivers, excluded, disabled }) => {
  const selectedDriver = value ? (drivers.find((d) => d.code === value) ?? null) : null;
  const initials = selectedDriver?.code ?? null;
  const podiumRingClass = selectedDriver
    ? {
        1: "border-amber-300 bg-amber-300/20 text-amber-100 shadow-[0_0_20px_rgb(252_211_77_/_0.35),0_0_60px_rgb(252_211_77_/_0.12)]",
        2: "border-slate-200 bg-slate-200/20 text-slate-100 shadow-[0_0_20px_rgb(226_232_240_/_0.3),0_0_60px_rgb(226_232_240_/_0.1)]",
        3: "border-orange-400 bg-orange-500/20 text-orange-100 shadow-[0_0_20px_rgb(251_146_60_/_0.32),0_0_60px_rgb(251_146_60_/_0.1)]",
      }[position]
    : "border-muted-foreground/20 bg-muted text-foreground";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-20 sm:w-20 ${podiumRingClass}`}
      >
        <span className="font-display text-xl font-bold">{initials ?? position}</span>
      </div>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <DriverDropdown
        value={value}
        onChange={onChange}
        drivers={drivers}
        excluded={excluded}
        disabled={disabled}
      />
    </div>
  );
};

const Predictions = () => {
  const { token, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [races, setRaces]                         = useState([]);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(null);
  const [nextRaceIndex, setNextRaceIndex]         = useState(null);
  const [drivers, setDrivers]                     = useState([]);
  const [prediction, setPrediction]               = useState(null);
  const [result, setResult]                       = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [loadingRace, setLoadingRace]             = useState(true);
  const [saving, setSaving]                       = useState(false);

  const [p1, setP1]                 = useState("");
  const [p2, setP2]                 = useState("");
  const [p3, setP3]                 = useState("");
  const [fastestLap, setFastestLap] = useState("");
  const [safetyCar, setSafetyCar]   = useState(null);

  const authFetch = useCallback(
    (path, options = {}) =>
      fetch(`${API}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      }),
    [token]
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [raceData, driverData] = await Promise.all([
          fetch("https://f1api.dev/api/2026").then((r) => r.json()),
          getCurrentDriverStandings(),
        ]);
        if (cancelled) return;

        const raceList = raceData.races ?? [];
        const now = new Date();
        const nxtIdx = raceList.findIndex((race) => {
          const d = getRaceDateTime(race);
          return d && d > now;
        });

        setRaces(raceList);
        setDrivers(driverData);
        setNextRaceIndex(nxtIdx);
        setSelectedRaceIndex(nxtIdx >= 0 ? nxtIdx : Math.max(0, raceList.length - 1));
      } catch {
        if (!cancelled) addToast("Failed to load race data.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [addToast]);

  useEffect(() => {
    if (selectedRaceIndex === null || races.length === 0) return;
    let cancelled = false;
    const race  = races[selectedRaceIndex];
    const round = race.round ?? (selectedRaceIndex + 1);

    setPrediction(null);
    setResult(null);
    setP1("");
    setP2("");
    setP3("");
    setFastestLap("");
    setSafetyCar(null);
    setLoadingRace(true);

    async function loadRaceData() {
      try {
        const [predRes, resultRes] = await Promise.all([
          authFetch(`/predictions?year=${RACE_YEAR}&round=${round}`),
          fetch(`${API}/races/results?year=${RACE_YEAR}&round=${round}`),
        ]);
        const pred       = await predRes.json();
        const raceResult = await resultRes.json();
        if (cancelled) return;

        if (pred && !pred.error) {
          setPrediction(pred);
          setP1(pred.p1 ?? "");
          setP2(pred.p2 ?? "");
          setP3(pred.p3 ?? "");
          setFastestLap(pred.fastest_lap ?? "");
          setSafetyCar(pred.safety_car_count ?? null);
        }
        if (raceResult) setResult(raceResult);
      } catch {
        if (!cancelled) addToast("Failed to load prediction data.", "error");
      } finally {
        if (!cancelled) setLoadingRace(false);
      }
    }

    loadRaceData();
    return () => { cancelled = true; };
  }, [selectedRaceIndex, races, authFetch, addToast]);

  const selectedRace = selectedRaceIndex !== null ? (races[selectedRaceIndex] ?? null) : null;
  const raceRound    = selectedRace?.round ?? null;
  const raceDate     = selectedRace ? getRaceDateTime(selectedRace) : null;
  const isPastRace   = raceDate ? raceDate <= new Date() : false;
  const locked       = prediction?.is_locked ?? false;
  const canEdit      = !locked && !isPastRace;
  const allFilled    = p1 && p2 && p3 && fastestLap && safetyCar !== null;
  const gpName       = selectedRace?.raceName ?? selectedRace?.circuit?.circuitName ?? "Race";
  const showForm     = !isPastRace || !!prediction;

  const flCorrect = !!(locked && result && prediction?.fastest_lap && prediction.fastest_lap === result.fastest_lap);
  const predSC    = prediction?.safety_car_count ?? 0;
  const actualSC  = result?.safety_car_count ?? 0;
  const scDiff    = result != null ? Math.abs(predSC - actualSC) : -1;
  const scPts     = scDiff === 0 ? POINTS.sc_exact : scDiff === 1 ? POINTS.sc_off1 : 0;

  const excludedFromP1   = [p2, p3].filter(Boolean);
  const excludedFromP2   = [p1, p3].filter(Boolean);
  const excludedFromP3   = [p1, p2].filter(Boolean);
  const fastestLapDriver = fastestLap ? (drivers.find((d) => d.code === fastestLap) ?? null) : null;

  async function handleSave(andLock = false) {
    if (!allFilled || !raceRound) return;
    setSaving(true);
    try {
      const upsertRes = await authFetch("/predictions", {
        method: "POST",
        body: JSON.stringify({
          race_year: RACE_YEAR,
          race_round: raceRound,
          race: selectedRace,
          p1, p2, p3,
          fastest_lap: fastestLap,
          safety_car_count: safetyCar,
        }),
      });
      if (!upsertRes.ok) {
        const err = await upsertRes.json();
        const msg = err.error === "PREDICTIONS_LOCKED"
          ? "Qualifying has started — predictions are now closed."
          : err.error ?? "Failed to save prediction.";
        addToast(msg, "error");
        return;
      }
      const saved = await upsertRes.json();
      setPrediction(saved);

      if (andLock) {
        const lockRes = await authFetch(`/predictions/${saved.id}/lock`, { method: "POST" });
        if (!lockRes.ok) {
          const err = await lockRes.json();
          const msg = err.error === "PREDICTIONS_LOCKED"
            ? "Qualifying has started — predictions are now closed."
            : err.error ?? "Failed to lock prediction.";
          addToast(msg, "error");
          return;
        }
        const lockedPred = await lockRes.json();
        setPrediction(lockedPred);
        await refreshUser();
        addToast("Predictions locked in!");
      } else {
        addToast("Draft saved.");
      }
    } catch {
      addToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  function computePoints(pred, res) {
    let pts = 0;
    if (pred.p1 === res.p1) pts += POINTS.p1;
    if (pred.p2 === res.p2) pts += POINTS.p2;
    if (pred.p3 === res.p3) pts += POINTS.p3;
    if (pred.fastest_lap && pred.fastest_lap === res.fastest_lap) pts += POINTS.fastest_lap;
    const diff = Math.abs((pred.safety_car_count ?? 0) - (res.safety_car_count ?? 0));
    if (diff === 0)      pts += POINTS.sc_exact;
    else if (diff === 1) pts += POINTS.sc_off1;
    return pts;
  }

  function driverName(code) {
    return drivers.find((d) => d.code === code)?.name ?? code;
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-72 rounded bg-muted/50" />
          <div className="h-4 w-48 rounded bg-muted/50" />
          <div className="glass-card h-14 rounded-2xl bg-muted/20" />
          <div className="glass-card h-48 rounded-2xl bg-muted/20" />
          <div className="glass-card h-32 rounded-2xl bg-muted/20" />
          <div className="glass-card h-32 rounded-2xl bg-muted/20" />
        </div>
      </div>
    );
  }

  if (!races.length) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 font-display text-3xl">SEASON NOT STARTED</h1>
        <p className="text-muted-foreground">Predictions will open when the season begins.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-1 font-display text-3xl sm:text-4xl">MAKE YOUR PREDICTIONS</h1>
        <p className="mb-6 text-muted-foreground">Navigate between races to view and make predictions.</p>

        <div className="glass-card mb-6 flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setSelectedRaceIndex((i) => i - 1)}
            disabled={selectedRaceIndex === 0}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-sm font-semibold">{gpName}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Round {raceRound ?? "—"} / {races.length}</span>
              {selectedRaceIndex === nextRaceIndex && nextRaceIndex >= 0 && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  NEXT RACE
                </span>
              )}
              {isPastRace && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  PAST
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedRaceIndex((i) => i + 1)}
            disabled={selectedRaceIndex === races.length - 1}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loadingRace ? (
          <div className="animate-pulse space-y-4">
            <div className="glass-card h-24 rounded-2xl bg-muted/20" />
            <div className="glass-card h-48 rounded-2xl bg-muted/20" />
            <div className="glass-card h-32 rounded-2xl bg-muted/20" />
          </div>
        ) : (
          <>
            {locked && result && (
              <div className="glass-card mb-6 border border-podium-green/30 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-podium-green" />
                  <span className="font-display text-lg text-podium-green">
                    RESULT — {computePoints(prediction, result)} PTS EARNED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "P1", predicted: prediction.p1, actual: result.p1, pts: POINTS.p1 },
                    { label: "P2", predicted: prediction.p2, actual: result.p2, pts: POINTS.p2 },
                    { label: "P3", predicted: prediction.p3, actual: result.p3, pts: POINTS.p3 },
                  ].map(({ label, predicted, actual, pts }) => {
                    const correct = predicted === actual;
                    return (
                      <div
                        key={label}
                        className={`rounded-xl p-3 ${correct ? "border border-podium-green/30 bg-podium-green/10" : "bg-muted"}`}
                      >
                        <div className="mb-1 text-xs text-muted-foreground">{label}</div>
                        <div className="font-semibold">{driverName(predicted)}</div>
                        {!correct && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Actual: {driverName(actual)}
                          </div>
                        )}
                        <div className={`mt-1 text-xs ${correct ? "text-podium-green" : "text-muted-foreground"}`}>
                          {correct ? `+${pts} pts` : "0 pts"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className={`rounded-xl p-3 ${flCorrect ? "border border-podium-green/30 bg-podium-green/10" : "bg-muted"}`}>
                    <div className="mb-1 text-xs text-muted-foreground">Fastest Lap</div>
                    <div className="font-semibold">
                      {prediction.fastest_lap ? driverName(prediction.fastest_lap) : "—"}
                    </div>
                    {!flCorrect && result.fastest_lap && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Actual: {driverName(result.fastest_lap)}
                      </div>
                    )}
                    <div className={`mt-1 text-xs ${flCorrect ? "text-podium-green" : "text-muted-foreground"}`}>
                      {flCorrect ? `+${POINTS.fastest_lap} pts` : "0 pts"}
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-3 ${
                      scDiff === 0
                        ? "border border-podium-green/30 bg-podium-green/10"
                        : scDiff === 1
                        ? "border border-amber-500/30 bg-amber-500/10"
                        : "bg-muted"
                    }`}
                  >
                    <div className="mb-1 text-xs text-muted-foreground">Safety Car</div>
                    <div className="font-semibold">
                      Predicted {predSC}, Actual {actualSC}
                    </div>
                    <div
                      className={`mt-1 text-xs ${
                        scDiff === 0
                          ? "text-podium-green"
                          : scDiff === 1
                          ? "text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {scPts > 0 ? `+${scPts} pts` : "0 pts"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {locked && !result && (
              <div className="glass-card mb-6 flex items-center gap-3 border border-podium-green/30 p-4">
                <Check className="h-5 w-5 shrink-0 text-podium-green" />
                <p className="text-sm text-muted-foreground">
                  {isPastRace
                    ? 'Race results not yet available. Points will be awarded once results are confirmed.'
                    : 'Your predictions are locked. Points will be awarded after the race.'}
                </p>
              </div>
            )}

            {isPastRace && prediction && !locked && (
              <div className="glass-card mb-6 flex items-center gap-3 border border-muted p-4">
                <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  This race has concluded. Your draft prediction was not locked in time.
                </p>
              </div>
            )}

            {isPastRace && !prediction && (
              <div className="glass-card mb-6 flex items-center gap-3 border border-muted p-4">
                <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No prediction was made for this race.
                  {result && ` Result: ${driverName(result.p1)} / ${driverName(result.p2)} / ${driverName(result.p3)}.`}
                </p>
              </div>
            )}

            {showForm && (
              <>
                <div className="glass-card mb-6 p-6 sm:p-8">
                  <div className="mb-6 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg">PODIUM PREDICTION</h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                      P1 +{POINTS.p1} · P2 +{POINTS.p2} · P3 +{POINTS.p3} pts
                    </span>
                  </div>
                  <div className="flex justify-center gap-6 sm:gap-10">
                    {[
                      { label: "2nd", pos: "2", val: p2, set: setP2, excl: excludedFromP2 },
                      { label: "1st", pos: "1", val: p1, set: setP1, excl: excludedFromP1 },
                      { label: "3rd", pos: "3", val: p3, set: setP3, excl: excludedFromP3 },
                    ].map(({ label, pos, val, set, excl }) => (
                      <DriverSelect
                        key={pos}
                        label={label}
                        position={pos}
                        value={val}
                        onChange={set}
                        drivers={drivers}
                        excluded={excl}
                        disabled={!canEdit}
                      />
                    ))}
                  </div>
                </div>

                <div className="glass-card mb-6 p-6 sm:p-8">
                  <div className="mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-secondary" />
                    <h2 className="font-display text-lg">FASTEST LAP</h2>
                    <span className="ml-auto text-xs text-muted-foreground">+{POINTS.fastest_lap} pts</span>
                  </div>
                  <DriverDropdown
                    value={fastestLap}
                    onChange={setFastestLap}
                    drivers={drivers}
                    excluded={[]}
                    disabled={!canEdit}
                  />
                  {fastestLapDriver && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2">
                      <span className="text-base leading-none">
                        {NATIONALITY_FLAGS[fastestLapDriver.nationality] ?? "🏁"}
                      </span>
                      <span className="text-sm">{fastestLapDriver.name}</span>
                      <span className="ml-auto font-mono text-xs text-secondary">{fastestLapDriver.code}</span>
                    </div>
                  )}
                </div>

                <div className="glass-card mb-8 p-6 sm:p-8">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg">SAFETY CAR COUNT</h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Exact +{POINTS.sc_exact} · ±1 +{POINTS.sc_off1} pts
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {SC_OPTIONS.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => canEdit && setSafetyCar(value)}
                        disabled={!canEdit}
                        className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                          safetyCar === value
                            ? "bg-primary text-primary-foreground glow-red"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleSave(false)}
                      disabled={!allFilled || saving}
                      className="flex-1 rounded-2xl border border-glass-border py-4 font-display text-sm uppercase tracking-wider transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving ? "Saving…" : "Save Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      disabled={!allFilled || saving}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 font-display text-sm uppercase tracking-wider transition-all ${
                        allFilled && !saving
                          ? "bg-primary text-primary-foreground glow-red hover:brightness-110"
                          : "cursor-not-allowed bg-muted text-muted-foreground"
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                      Lock In Your Predictions
                    </button>
                  </div>
                )}

                {locked && (
                  <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-podium-green/30 bg-podium-green/20 py-4 font-display text-sm uppercase tracking-wider text-podium-green">
                    <Check className="h-5 w-5" />
                    Predictions Locked
                  </div>
                )}

                {!allFilled && canEdit && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Fill in all selections to save or lock your predictions.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Predictions;
