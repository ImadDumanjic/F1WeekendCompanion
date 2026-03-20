import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Trophy,
  Brain,
  Radio,
  User,
  Flag,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: Flag },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/predictions", label: "Predictions", icon: BarChart3 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/ai-summary", label: "AI Summary", icon: Brain },
  { to: "/live", label: "Live", icon: Radio, isLive: true },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <RouterNavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-red">
            <Flag className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg tracking-tight">F1 COMPANION</span>
        </RouterNavLink>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <RouterNavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                  </span>
                )}
                <item.icon className="w-4 h-4" />
                {item.label}
              </RouterNavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <Trophy className="w-4 h-4 text-podium-green" />
            <span className="text-sm font-semibold">1,250 pts</span>
          </div>
          <RouterNavLink
            to="/profile"
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <User className="w-4 h-4" />
          </RouterNavLink>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <div className="flex flex-col gap-1">
              <span
                className={`w-4 h-0.5 bg-foreground transition-all ${
                  mobileOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`w-4 h-0.5 bg-foreground transition-all ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-4 h-0.5 bg-foreground transition-all ${
                  mobileOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden glass-nav border-t border-glass-border animate-fade-up">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;

              return (
                <RouterNavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {item.isLive && (
                    <span className="relative flex h-2 w-2 ml-auto">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                    </span>
                  )}
                </RouterNavLink>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
