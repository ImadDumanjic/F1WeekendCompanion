import { motion } from "framer-motion";
import {
  Brain,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import Layout from "@/components/Layout";

const podiumDrivers = [
  {
    position: "2nd",
    name: "Lewis Hamilton",
    team: "Ferrari",
    color: "text-gray-300",
  },
  {
    position: "1st",
    name: "Max Verstappen",
    team: "Red Bull Racing",
    color: "text-yellow-400",
  },
  {
    position: "3rd",
    name: "Lando Norris",
    team: "McLaren",
    color: "text-amber-600",
  },
];

const highlights = [
  {
    time: "Lap 1",
    event:
      "Verstappen takes the lead from P2 with a stunning overtake into Turn 1",
    type: "key",
  },
  {
    time: "Lap 15",
    event:
      "Safety car deployed after Alonso and Magnussen collide at the chicane",
    type: "safety",
  },
  {
    time: "Lap 28",
    event: "Hamilton pits for hard tyres and attempts the undercut on Norris",
    type: "pit",
  },
  {
    time: "Lap 42",
    event: "Norris sets the fastest lap with a 1:21.432",
    type: "fastest",
  },
  {
    time: "Lap 53",
    event: "Verstappen crosses the line to win by 3.2 seconds",
    type: "finish",
  },
];

const moversUp = [
  { name: "Albon", change: "+7" },
  { name: "Gasly", change: "+5" },
  { name: "Tsunoda", change: "+4" },
];

const moversDown = [
  { name: "Alonso", change: "-12 (DNF)" },
  { name: "Magnussen", change: "-10 (DNF)" },
  { name: "Sargeant", change: "-5" },
];

const AISummary = () => {
  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-secondary" />
            <h1 className="font-display text-3xl sm:text-4xl">
              POST-RACE ANALYSIS
            </h1>
          </div>
          <p className="mb-8 text-muted-foreground">
            Italian Grand Prix, AI-Generated Summary
          </p>

          <div className="glass-card mb-6 p-6 sm:p-8">
            <p className="leading-relaxed text-muted-foreground">
              Max Verstappen delivered a masterclass at Monza, converting his P2
              grid slot into a dominant victory. A bold move into Turn 1 set the
              tone for the race. Hamilton&apos;s strategic undercut proved crucial
              for the final podium positions, while Norris fought valiantly but
              could not match the Red Bull pace in the final stint.
            </p>
          </div>

          <div className="glass-card mb-6 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg">PODIUM RESULT</h2>
            </div>
            <div className="flex justify-center gap-6 sm:gap-10">
              {podiumDrivers.map((driver, index) => (
                <div
                  key={driver.name}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full bg-muted font-display text-xl sm:h-20 sm:w-20 ${
                      index === 1 ? "ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    {driver.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <span className={`font-display text-sm ${driver.color}`}>
                    {driver.position}
                  </span>
                  <span className="text-sm font-semibold">{driver.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {driver.team}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card mb-6 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-lg">RACE HIGHLIGHTS</h2>
            </div>
            <div className="space-y-0">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={`${highlight.time}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="relative z-10 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                    {index < highlights.length - 1 && (
                      <div className="flex-1 w-px bg-muted" />
                    )}
                  </div>
                  <div className="pb-6">
                    <span className="text-xs font-semibold uppercase text-secondary">
                      {highlight.time}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {highlight.event}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-podium-green" />
                <h3 className="font-display text-sm">BIGGEST GAINERS</h3>
              </div>
              {moversUp.map((driver) => (
                <div
                  key={driver.name}
                  className="flex items-center justify-between border-b border-glass-border py-2 last:border-0"
                >
                  <span className="text-sm">{driver.name}</span>
                  <span className="text-sm font-semibold text-podium-green">
                    {driver.change}
                  </span>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                <h3 className="font-display text-sm">BIGGEST LOSERS</h3>
              </div>
              {moversDown.map((driver) => (
                <div
                  key={driver.name}
                  className="flex items-center justify-between border-b border-glass-border py-2 last:border-0"
                >
                  <span className="text-sm">{driver.name}</span>
                  <span className="text-sm font-semibold text-primary">
                    {driver.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AISummary;
