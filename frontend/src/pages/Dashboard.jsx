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
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 5);
targetDate.setHours(14, 0, 0, 0);

const useCountdown = (target) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
};

const CountdownBlock = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="glass-card px-4 py-3 sm:px-6 sm:py-4 min-w-[64px] sm:min-w-[80px] text-center">
      <span className="font-display text-2xl sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">
      {label}
    </span>
  </div>
);

const Dashboard = () => {
  const countdown = useCountdown(targetDate);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative glass-card p-6 sm:p-10 mb-8 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
            <svg
              viewBox="0 0 400 200"
              className="w-full max-w-2xl"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M50,100 C50,50 100,20 150,30 C200,40 180,80 220,70 C260,60 280,30 320,50 C360,70 370,120 330,140 C290,160 250,130 210,140 C170,150 160,180 120,170 C80,160 50,150 50,100Z" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                Next Race Weekend
              </span>
              <span className="text-2xl">🇮🇹</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl mb-2">
              ITALIAN GRAND PRIX
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm mb-8">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Monza, Italy
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> March 20-22, 2026
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { icon: Timer, label: "53 Laps", sublabel: "Race Distance" },
                { icon: Ruler, label: "5.793 km", sublabel: "Track Length" },
                { icon: Flag, label: "2004", sublabel: "First GP" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50"
                >
                  <stat.icon className="w-5 h-5 text-secondary" />
                  <div>
                    <div className="text-sm font-semibold">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.sublabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

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
            <CountdownBlock value={countdown.days} label="Days" />
            <span className="font-display text-2xl sm:text-4xl pulse-colon mt-[-1.5rem]">
              :
            </span>
            <CountdownBlock value={countdown.hours} label="Hours" />
            <span className="font-display text-2xl sm:text-4xl pulse-colon mt-[-1.5rem]">
              :
            </span>
            <CountdownBlock value={countdown.minutes} label="Mins" />
            <span className="font-display text-2xl sm:text-4xl pulse-colon mt-[-1.5rem]">
              :
            </span>
            <CountdownBlock value={countdown.seconds} label="Secs" />
          </div>
        </motion.section>

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
          <Link
            to="/schedule"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass-card text-foreground font-display text-sm tracking-wider uppercase hover:bg-muted transition-all"
          >
            <CalendarDays className="w-5 h-5" />
            View Full Schedule
          </Link>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              title: "Your Rank",
              value: "#12",
              sub: "of 1,847 players",
              color: "text-secondary",
            },
            {
              title: "Prediction Accuracy",
              value: "68%",
              sub: "Last 5 races",
              color: "text-podium-green",
            },
            {
              title: "Points This Season",
              value: "1,250",
              sub: "+180 last race",
              color: "text-primary",
            },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 hover-lift">
              <div className="text-sm text-muted-foreground mb-1">
                {stat.title}
              </div>
              <div className={`font-display text-3xl ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.sub}
              </div>
            </div>
          ))}
        </motion.section>
      </div>
    </Layout>
  );
};

export default Dashboard;
