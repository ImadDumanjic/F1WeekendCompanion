import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const TEAM_COLORS = {
  'Red Bull':     '#3671C6',
  'Ferrari':      '#E8002D',
  'McLaren':      '#FF8000',
  'Mercedes':     '#27F4D2',
  'Aston Martin': '#229971',
  'Williams':     '#64C4FF',
  'Haas':         '#B6BABD',
  'Alpine':       '#FF87BC',
  'Sauber':       '#52E252',
  'Racing Bulls': '#6692FF',
};

const DRIVERS = [
  { id: 1,  name: 'Max Verstappen',    number: 1,  team: 'Red Bull' },
  { id: 2,  name: 'Liam Lawson',       number: 30, team: 'Red Bull' },
  { id: 3,  name: 'Charles Leclerc',   number: 16, team: 'Ferrari' },
  { id: 4,  name: 'Lewis Hamilton',    number: 44, team: 'Ferrari' },
  { id: 5,  name: 'Lando Norris',      number: 4,  team: 'McLaren' },
  { id: 6,  name: 'Oscar Piastri',     number: 81, team: 'McLaren' },
  { id: 7,  name: 'George Russell',    number: 63, team: 'Mercedes' },
  { id: 8,  name: 'Kimi Antonelli',    number: 12, team: 'Mercedes' },
  { id: 9,  name: 'Fernando Alonso',   number: 14, team: 'Aston Martin' },
  { id: 10, name: 'Lance Stroll',      number: 18, team: 'Aston Martin' },
  { id: 11, name: 'Carlos Sainz',      number: 55, team: 'Williams' },
  { id: 12, name: 'Alexander Albon',   number: 23, team: 'Williams' },
  { id: 13, name: 'Esteban Ocon',      number: 31, team: 'Haas' },
  { id: 14, name: 'Oliver Bearman',    number: 87, team: 'Haas' },
  { id: 15, name: 'Pierre Gasly',      number: 10, team: 'Alpine' },
  { id: 16, name: 'Jack Doohan',       number: 7,  team: 'Alpine' },
  { id: 17, name: 'Nico Hülkenberg',   number: 27, team: 'Sauber' },
  { id: 18, name: 'Gabriel Bortoleto', number: 5,  team: 'Sauber' },
  { id: 19, name: 'Isack Hadjar',      number: 6,  team: 'Racing Bulls' },
  { id: 20, name: 'Yuki Tsunoda',      number: 22, team: 'Racing Bulls' },
];

export default function SelectFavoriteDriver() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selected, setSelected] = useState(null);

  function handleContinue() {
    if (!selected) return;
    localStorage.setItem('favoriteDriver', JSON.stringify(selected));
    addToast(`${selected.name} set as your favorite driver!`);
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl tracking-tight mb-2">Choose Your Driver</h1>
          <p className="text-muted-foreground text-sm">Select your favorite from the 2025 F1 grid</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {DRIVERS.map(driver => {
            const color = TEAM_COLORS[driver.team];
            const isSelected = selected?.id === driver.id;

            return (
              <button
                key={driver.id}
                onClick={() => setSelected(driver)}
                className={`glass-card p-4 flex flex-col gap-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-display font-bold" style={{ color }}>
                    #{driver.number}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">{driver.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{driver.team}</p>
                </div>
                <div className="h-0.5 rounded-full mt-1 opacity-60" style={{ backgroundColor: color }} />
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
