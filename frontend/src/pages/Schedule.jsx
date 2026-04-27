import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  Thermometer,
  Droplets,
  Wind,
  ChevronRight,
  CornerDownRight,
} from "lucide-react";
import {
  CIRCUIT_DATA,
  COUNTRY_FLAGS,
  SESSION_META,
  parseUTC,
  formatLocalTime,
  formatDateRange,
  wmoInfo,
  getRaceDateTime,
} from "@/lib/f1-data";
import { getCircuitImage } from "@/services/circuitImageService";

function getRaceStatus(raceDate, isNext) {
  const now = new Date();
  if (!raceDate) return "upcoming";
  if (raceDate < now) return "completed";
  if (isNext) return "next";
  return "upcoming";
}

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className="glass-card h-28 animate-pulse"
        style={{ animationDelay: `${i * 60}ms` }}
      />
    ))}
  </div>
);

function useCircuitImage(circuitId) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!circuitId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCircuitImage(circuitId)
      .then((u) => {
        if (mounted.current) {
          setUrl(u ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [circuitId]);

  return { url, loading };
}

const RaceCard = ({ race, index, status, onClick }) => {
  const flag = COUNTRY_FLAGS[race.circuit?.country] ?? "🏁";
  const isNext = status === "next";
  const isCompleted = status === "completed";
  const { url: circuitImg } = useCircuitImage(race.circuit?.circuitId);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.6) }}
      onClick={onClick}
      className={[
        "glass-card relative overflow-hidden p-5 text-left w-full cursor-pointer transition-all duration-200 hover-lift",
        isCompleted ? "opacity-45" : "",
        isNext ? "border-primary/40 glow-red" : "",
      ].join(" ")}
    >
      {circuitImg && (
        <img
          src={circuitImg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-2/5 object-contain opacity-[0.08]"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        {/* Left: round + info */}
        <div className="flex items-start gap-4 min-w-0">
          <span
            className={`font-display text-5xl leading-none tabular-nums shrink-0 ${isCompleted ? "text-muted-foreground/40" : "text-primary"}`}
          >
            {String(race.round).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="text-xl mb-0.5">{flag}</div>
            <div className="font-display text-sm leading-snug">
              {(race.raceName ?? race.circuit?.circuitName ?? "").replace(
                " Grand Prix",
                " GP",
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {race.circuit?.city}, {race.circuit?.country}
              </span>
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-0.5">
              {formatDateRange(race.schedule)}
            </div>
          </div>
        </div>

        {/* Right: badge + chevron */}
        <div className="shrink-0 flex flex-col items-end justify-between h-full gap-3">
          {isNext && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              Next Race
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground/70 text-[10px] font-semibold uppercase tracking-wider">
              Done
            </span>
          )}
          {!isNext && !isCompleted && (
            <span className="px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
              Upcoming
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </motion.button>
  );
};

const SessionRow = ({ session, isPast, isNext, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: index * 0.055 }}
    className={[
      "glass-card flex items-center justify-between p-4 transition-all",
      isPast ? "opacity-35" : "",
      isNext ? "border-primary/40 glow-red" : "",
    ].join(" ")}
  >
    <div className="flex items-center gap-4">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
          isPast ? "bg-muted/30" : isNext ? "bg-primary/20" : "bg-muted/50"
        }`}
      >
        {isPast ? (
          <CheckCircle className="h-4 w-4 text-muted-foreground/60" />
        ) : (
          <Clock
            className={`h-4 w-4 ${isNext ? "text-primary" : "text-muted-foreground"}`}
          />
        )}
      </div>
      <div>
        <div
          className={`font-semibold text-sm ${isNext ? "text-primary" : ""}`}
        >
          {session.label}
        </div>
        {session.formatted && (
          <div className="font-mono text-xs text-muted-foreground">
            {session.formatted.day} · {session.formatted.time}
            <span className="text-muted-foreground/50 ml-1">local</span>
          </div>
        )}
      </div>
    </div>
    {isNext && (
      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider">
        Up Next
      </span>
    )}
    {isPast && (
      <span className="px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground/60 text-[10px] font-semibold uppercase tracking-wider">
        Done
      </span>
    )}
  </motion.div>
);

const WeatherPanel = ({ weather, loading }) => (
  <motion.div
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35, delay: 0.15 }}
  >
    <h2 className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-4">
      Race Day Forecast
    </h2>

    <div className="glass-card p-6">
      {loading && (
        <div className="h-36 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && !weather && (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Forecast available
            <br />
            within 16 days of race day.
          </p>
        </div>
      )}

      {!loading &&
        weather &&
        (() => {
          const { icon, label } = wmoInfo(weather.wmo);
          return (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">{icon}</div>
                <div className="font-display text-5xl">
                  {Math.round(weather.temp)}°
                  <span className="text-xl text-muted-foreground">C</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {label}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    Icon: Droplets,
                    label: "Rain",
                    value: `${weather.rain ?? "—"}%`,
                  },
                  {
                    Icon: Wind,
                    label: "Wind",
                    value: `${weather.wind != null ? Math.round(weather.wind) : "—"} km/h`,
                  },
                  {
                    Icon: Thermometer,
                    label: "Humidity",
                    value: `${weather.humidity != null ? Math.round(weather.humidity) : "—"}%`,
                  },
                ].map(({ Icon, label: lbl, value }) => (
                  <div
                    key={lbl}
                    className="rounded-xl bg-muted/50 p-3 text-center"
                  >
                    <Icon className="mx-auto mb-1 h-4 w-4 text-secondary" />
                    <div className="font-mono text-sm font-semibold">
                      {value}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {lbl}
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
    </div>
  </motion.div>
);

const DetailView = ({ race, onBack, weather, weatherLoading }) => {
  const circuitId = race.circuit?.circuitId;
  const circuitMeta = CIRCUIT_DATA[circuitId];
  const { url: circuitImg } = useCircuitImage(circuitId);
  const timezone = circuitMeta?.timezone ?? "UTC";
  const now = new Date();
  const flag = COUNTRY_FLAGS[race.circuit?.country] ?? "🏁";

  const tzLabel =
    timezone === "UTC"
      ? "UTC"
      : (timezone.split("/")[1]?.replace(/_/g, " ") ?? timezone);

  const sessionList = Object.entries(race.schedule ?? {})
    .filter(([key, val]) => val?.date && val?.time && SESSION_META[key])
    .map(([key, s]) => {
      const dt = parseUTC(s.date, s.time);
      return {
        key,
        label: SESSION_META[key].label,
        dt,
        formatted: dt ? formatLocalTime(dt, timezone) : null,
      };
    })
    .sort((a, b) => {
      if (!a.dt && !b.dt) return 0;
      if (!a.dt) return -1;
      if (!b.dt) return 1;
      return a.dt.getTime() - b.dt.getTime();
    });

  const nextIdx = sessionList.findIndex((s) => s.dt && s.dt > now);

  const c = race.circuit;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          All Races
        </button>

        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-6 sm:p-8 mb-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.025] flex items-end justify-end pointer-events-none pr-6 pb-4">
            <span className="font-display text-[10rem] leading-none text-foreground select-none">
              {String(race.round).padStart(2, "0")}
            </span>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:gap-6">
            {/* ── Left: text content ── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display text-primary text-sm tracking-widest">
                  ROUND {String(race.round).padStart(2, "0")}
                </span>
                <span className="text-2xl">{flag}</span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl mb-2 leading-none">
                {(
                  race.raceName ??
                  race.circuit?.circuitName ??
                  ""
                ).toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {c?.circuitName ?? "—"}, {c?.city}
                </span>
                <span className="flex items-center gap-1 font-mono text-xs">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  {formatDateRange(race.schedule)}
                </span>
              </div>

              {c && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {c.circuitLength && (
                    <div className="px-3 py-1.5 rounded-xl bg-muted/50 text-xs">
                      <span className="text-muted-foreground">Length </span>
                      <span className="font-mono font-semibold">
                        {Math.round(parseFloat(c.circuitLength))} km
                      </span>
                    </div>
                  )}
                  {c.numberOfCorners && (
                    <div className="px-3 py-1.5 rounded-xl bg-muted/50 text-xs">
                      <span className="text-muted-foreground">Corners </span>
                      <span className="font-mono font-semibold">
                        {c.numberOfCorners}
                      </span>
                    </div>
                  )}
                  {c.lapRecord && (
                    <div className="px-3 py-1.5 rounded-xl bg-muted/50 text-xs">
                      <span className="text-muted-foreground">Lap Record </span>
                      <span className="font-mono font-semibold">
                        {c.lapRecord}
                      </span>
                    </div>
                  )}
                  <div className="px-3 py-1.5 rounded-xl bg-muted/50 text-xs">
                    <span className="text-muted-foreground">Timezone </span>
                    <span className="font-mono font-semibold">{tzLabel}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: circuit map ── */}
            {circuitImg && (
              <div className="mt-6 sm:mt-0 sm:shrink-0 flex items-center justify-center sm:justify-end">
                <img
                  src={circuitImg}
                  alt={`${c?.circuitName ?? ""} track map`}
                  className="max-h-32 sm:max-h-44 w-auto max-w-[200px] sm:max-w-[260px] object-contain opacity-85 mix-blend-luminosity"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Body: sessions + weather */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Sessions */}
          <div className="lg:col-span-3">
            <h2 className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-4">
              Weekend Schedule
            </h2>
            <div className="space-y-3">
              {sessionList.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No schedule data available yet.
                </p>
              )}
              {sessionList.map((session, i) => (
                <SessionRow
                  key={session.key}
                  session={session}
                  isPast={!!session.dt && session.dt < now}
                  isNext={i === nextIdx}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Weather */}
          <div className="lg:col-span-2">
            <WeatherPanel weather={weather} loading={weatherLoading} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const GridView = ({ races, onSelect }) => {
  const now = new Date();

  const nextRaceIndex = races.findIndex((race) => {
    const d = getRaceDateTime(race);
    return d && d > now;
  });

  const completed = races.filter((r) => {
    const d = getRaceDateTime(r);
    return d && d < now;
  }).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-1 font-display text-3xl sm:text-4xl">2026 SEASON</h1>
        <p className="mb-8 text-muted-foreground text-sm">
          Formula 1 World Championship ·{" "}
          <span className="text-secondary font-semibold">{completed}</span>/
          {races.length} races completed
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          {races.map((race, i) => {
            const raceDate = getRaceDateTime(race);
            const status = getRaceStatus(raceDate, i === nextRaceIndex);
            return (
              <div
                key={race.round ?? i}
                className={`mb-4 ${i % 2 !== 0 ? "sm:mt-6" : ""}`}
              >
                <RaceCard
                  race={race}
                  index={i}
                  status={status}
                  onClick={() => onSelect(race)}
                />
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

const Schedule = () => {
  const [view, setView] = useState("grid");
  const [selectedRace, setSelectedRace] = useState(null);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    fetch("https://f1api.dev/api/2026")
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        setRaces(data.races ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Couldn't load the 2026 calendar. Please try again.");
        setLoading(false);
      });
  }, []);

  const openDetail = useCallback((race) => {
    setSelectedRace(race);
    setView("detail");
    setWeather(null);

    const raceDate = getRaceDateTime(race);
    if (!raceDate) return;

    const daysUntil = (raceDate - new Date()) / 86_400_000;
    if (daysUntil > 16 || daysUntil < -1) return;

    const meta = CIRCUIT_DATA[race.circuit?.circuitId];
    if (!meta) return;

    const dateStr = race.schedule?.race?.date;
    if (!dateStr) return;

    setWeatherLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${meta.lat}&longitude=${meta.lng}` +
        `&daily=temperature_2m_max,precipitation_probability_max,weathercode,windspeed_10m_max,relative_humidity_2m_mean` +
        `&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const d = data.daily;
        if (d) {
          setWeather({
            temp: d.temperature_2m_max?.[0],
            rain: d.precipitation_probability_max?.[0],
            wind: d.windspeed_10m_max?.[0],
            humidity: d.relative_humidity_2m_mean?.[0],
            wmo: d.weathercode?.[0],
          });
        }
        setWeatherLoading(false);
      })
      .catch(() => setWeatherLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 font-display text-3xl sm:text-4xl">2026 SEASON</h1>
        <p className="mb-8 text-muted-foreground text-sm">Loading calendar…</p>
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (view === "detail" && selectedRace) {
    return (
      <DetailView
        race={selectedRace}
        onBack={() => setView("grid")}
        weather={weather}
        weatherLoading={weatherLoading}
      />
    );
  }

  return <GridView races={races} onSelect={openDetail} />;
};

export default Schedule;
