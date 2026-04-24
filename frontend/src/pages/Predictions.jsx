import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy, Zap, ShieldAlert, Check } from "lucide-react";

const drivers = [
  "Max Verstappen",
  "Lewis Hamilton",
  "Charles Leclerc",
  "Lando Norris",
  "Carlos Sainz",
  "Oscar Piastri",
  "George Russell",
  "Fernando Alonso",
  "Pierre Gasly",
  "Esteban Ocon",
  "Alexander Albon",
  "Yuki Tsunoda",
  "Daniel Ricciardo",
  "Valtteri Bottas",
  "Kevin Magnussen",
  "Nico Hulkenberg",
  "Zhou Guanyu",
  "Logan Sargeant",
  "Liam Lawson",
  "Oliver Bearman",
];

const DriverSelect = ({ label, position, value, onChange, excluded }) => (
  <div className="flex flex-col items-center gap-3">
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl sm:h-20 sm:w-20 ${
        position === "1"
          ? "border-2 border-primary bg-primary/20 glow-red"
          : position === "2"
            ? "border-2 border-muted-foreground/30 bg-muted"
            : "border-2 border-muted-foreground/20 bg-muted"
      }`}
    >
      {value
        ? value
            .split(" ")
            .map((name) => name[0])
            .join("")
        : position}
    </div>
    <span className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full max-w-[180px] rounded-xl border border-glass-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">Select driver</option>
      {drivers
        .filter((driver) => !excluded.includes(driver) || driver === value)
        .map((driver) => (
          <option key={driver} value={driver}>
            {driver}
          </option>
        ))}
    </select>
  </div>
);

const Predictions = () => {
  const [podium, setPodium] = useState(["", "", ""]);
  const [fastestLap, setFastestLap] = useState("");
  const [safetyCar, setSafetyCar] = useState(null);
  const [locked, setLocked] = useState(false);

  const allSelected = podium.every(Boolean) && fastestLap && safetyCar !== null;
  const excludedFromPodium = podium.filter(Boolean);

  const handleLock = () => {
    if (!allSelected) return;
    setLocked(true);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 font-display text-3xl sm:text-4xl">
            MAKE YOUR PREDICTIONS
          </h1>
          <p className="mb-8 text-muted-foreground">Italian Grand Prix, Monza</p>

          <div className="glass-card mb-6 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg">PODIUM PREDICTION</h2>
            </div>
            <div className="flex justify-center gap-6 sm:gap-10">
              {["2nd", "1st", "3rd"].map((label, index) => {
                const podiumIndex = [1, 0, 2][index];

                return (
                  <DriverSelect
                    key={podiumIndex}
                    label={label}
                    position={String(podiumIndex + 1)}
                    value={podium[podiumIndex]}
                    onChange={(driver) => {
                      const next = [...podium];
                      next[podiumIndex] = driver;
                      setPodium(next);
                    }}
                    excluded={excludedFromPodium}
                  />
                );
              })}
            </div>
          </div>

          <div className="glass-card mb-6 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-lg">FASTEST LAP</h2>
            </div>
            <select
              value={fastestLap}
              onChange={(event) => setFastestLap(event.target.value)}
              className="w-full rounded-xl border border-glass-border bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Select driver</option>
              {drivers.map((driver) => (
                <option key={driver} value={driver}>
                  {driver}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-card mb-8 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg">SAFETY CAR COUNT</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2, 3, "4+"].map((label, index) => (
                <button
                  key={String(label)}
                  onClick={() => setSafetyCar(index)}
                  className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                    safetyCar === index
                      ? "bg-primary text-primary-foreground glow-red"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLock}
            disabled={!allSelected || locked}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-sm uppercase tracking-wider transition-all ${
              locked
                ? "bg-podium-green text-success-foreground"
                : allSelected
                  ? "bg-primary text-primary-foreground glow-red hover:brightness-110"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {locked ? (
              <>
                <Check className="h-5 w-5" />
                Predictions Locked
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                Lock In Your Predictions
              </>
            )}
          </button>
        </motion.div>
    </div>
  );
};

export default Predictions;
