import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  getCurrentConstructorStandings,
  getCurrentDriverStandings,
} from '@/services/f1ApiService';
import {
  getFavoriteDriver,
  getFavoriteTeam,
  setFavoriteDriver,
  setFavoriteTeam,
} from '@/lib/favorites';

const API = 'http://localhost:3001/api';

const TABS = {
  drivers: 'drivers',
  teams: 'teams',
};

const TEAM_COLORS = {
  'Red Bull': '#3671C6',
  'Red Bull Racing Honda RBPT': '#3671C6',
  Ferrari: '#E8002D',
  McLaren: '#FF8000',
  Mercedes: '#27F4D2',
  'Aston Martin Aramco Mercedes': '#229971',
  'Aston Martin': '#229971',
  Williams: '#64C4FF',
  Haas: '#B6BABD',
  Alpine: '#FF87BC',
  'Kick Sauber Ferrari': '#52E252',
  Sauber: '#52E252',
  RB: '#6692FF',
  'Racing Bulls': '#6692FF',
};

const NATIONALITY_FLAGS = {
  American: '🇺🇸',
  Australian: '🇦🇺',
  British: '🇬🇧',
  Canadian: '🇨🇦',
  Dutch: '🇳🇱',
  Finnish: '🇫🇮',
  French: '🇫🇷',
  German: '🇩🇪',
  Italian: '🇮🇹',
  Japanese: '🇯🇵',
  Mexican: '🇲🇽',
  Monégasque: '🇲🇨',
  Monegasque: '🇲🇨',
  Spanish: '🇪🇸',
  Thai: '🇹🇭',
};

function getTeamColor(team) {
  return TEAM_COLORS[team] ?? 'hsl(var(--primary))';
}

function getFlag(nationality) {
  return NATIONALITY_FLAGS[nationality] ?? '🏁';
}

const Stat = ({ label, value, highlight = false }) => (
  <div className="rounded-xl border border-glass-border bg-background/55 px-3 py-2">
    <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className={`mt-1 font-display text-lg font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
      {value || '-'}
    </p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center gap-4 rounded-2xl border border-glass-border bg-card/60 p-8 text-center">
    <p className="text-sm text-destructive">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <RefreshCw className="h-4 w-4" />
      Try again
    </button>
  </div>
);

const LoadingState = () => (
  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-glass-border bg-card/60">
    <Loader2 className="h-7 w-7 animate-spin text-primary" />
  </div>
);

const StandingCard = ({ item, type, isFavorite, onFavorite }) => {
  const isDriver = type === TABS.drivers;
  const title = item.name || '-';
  const subtitle = isDriver ? item.team : item.nationality;
  const teamColor = getTeamColor(isDriver ? item.team : item.name);
  const number = item.number || item.position || '-';

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-card/60 p-4 backdrop-blur-xl transition-all hover:-translate-y-0.5 ${
        isFavorite
          ? 'border-primary/70 shadow-[0_0_30px_rgba(225,6,0,0.18)]'
          : 'border-glass-border hover:border-primary/45'
      }`}
    >
      {isFavorite && <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: teamColor }}
      />
      {isDriver && (
        <div className="pointer-events-none absolute right-5 top-2 font-display text-8xl font-bold leading-none text-white/[0.075]">
          {number}
        </div>
      )}

      <button
        type="button"
        onClick={() => onFavorite(item)}
        aria-label={`Set ${title} as favourite ${isDriver ? 'driver' : 'team'}`}
        className={`absolute right-4 top-4 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
          isFavorite
            ? 'border-primary bg-primary text-primary-foreground glow-red'
            : 'border-glass-border bg-muted/60 text-muted-foreground hover:border-primary hover:text-primary'
        }`}
      >
        <Heart className={`h-4.5 w-4.5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      <div className="mb-4 flex items-start justify-between gap-3 pr-12">
        <div className="flex min-w-0 gap-3">
          <div
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-glass-border bg-background/60"
            style={{ boxShadow: `inset 0 -3px 0 ${teamColor}` }}
          >
            <span className="font-display text-xl font-bold text-foreground">P{item.position || '-'}</span>
            <span className="font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {isDriver ? 'Rank' : 'Team'}
            </span>
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xl leading-none">{getFlag(item.nationality)}</span>
              <span className="rounded-full border border-glass-border bg-muted/60 px-2 py-0.5 font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                P{item.position || '-'}
              </span>
            </div>
            <p className="truncate font-display text-xl font-bold text-foreground">{title}</p>
            <p className="truncate text-sm text-muted-foreground">{subtitle || '-'}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 h-px bg-glass-border" />

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Points" value={item.points} highlight />
        <Stat label="Wins" value={item.wins} />
        <Stat label={isDriver ? 'Nation' : 'Origin'} value={item.nationality} />
      </div>
    </article>
  );
};

export default function SelectFavoriteDriver() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(TABS.drivers);
  const [drivers, setDrivers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [favoriteDriver, setFavoriteDriverState] = useState(() => getFavoriteDriver());
  const [favoriteTeam, setFavoriteTeamState] = useState(() => getFavoriteTeam());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStandings() {
    setLoading(true);
    setError('');

    try {
      const [driverStandings, constructorStandings] = await Promise.all([
        getCurrentDriverStandings(),
        getCurrentConstructorStandings(),
      ]);
      setDrivers(driverStandings);
      setTeams(constructorStandings);
    } catch (err) {
      setError(err.message || 'Unable to load current F1 standings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStandings();
  }, []);

  async function saveFavoriteToBackend(field, value) {
    try {
      await fetch(`${API}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
    } catch {
      // localStorage already updated — backend sync is best-effort
    }
  }

  function handleDriverFavorite(driver) {
    setFavoriteDriver(driver);
    setFavoriteDriverState(driver);
    saveFavoriteToBackend('favorite_driver', driver);
    addToast(`${driver.name} set as your favourite driver.`);
  }

  function handleTeamFavorite(team) {
    setFavoriteTeam(team);
    setFavoriteTeamState(team);
    saveFavoriteToBackend('favorite_team', team);
    addToast(`${team.name} set as your favourite team.`);
  }

  function handleContinue() {
    navigate('/');
  }

  const hasFavorite = Boolean(favoriteDriver || favoriteTeam);

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-8 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2.5 font-display text-xs font-bold uppercase tracking-[0.42em] text-primary">
              Paddock Picks
            </p>
            <h1 className="font-display text-4xl font-bold leading-none text-foreground sm:text-5xl">
              Favourites
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Lock in your favourite driver and constructor from live Jolpica F1 standings.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-glass-border bg-card/60 p-4 backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex flex-col gap-4 border-b border-glass-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {activeTab === TABS.drivers ? 'Driver standings' : 'Constructor standings'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select one favourite. A new selection replaces the previous one.
              </p>
            </div>

            <div className="inline-flex w-fit rounded-xl border border-glass-border bg-background/55 p-1">
              <button
                type="button"
                onClick={() => setActiveTab(TABS.drivers)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === TABS.drivers
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Drivers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(TABS.teams)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === TABS.teams
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Teams
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={loadStandings} />
          ) : activeTab === TABS.drivers ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {drivers.map(driver => (
                <StandingCard
                  key={driver.id}
                  item={driver}
                  type={TABS.drivers}
                  isFavorite={favoriteDriver?.id === driver.id}
                  onFavorite={handleDriverFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teams.map(team => (
                <StandingCard
                  key={team.id}
                  item={team}
                  type={TABS.teams}
                  isFavorite={favoriteTeam?.id === team.id}
                  onFavorite={handleTeamFavorite}
                />
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasFavorite}
            className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground glow-red transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:glow-none"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
