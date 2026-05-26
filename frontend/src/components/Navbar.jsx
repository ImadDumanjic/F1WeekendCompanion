import {
  NavLink as RouterNavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Calendar,
  Trophy,
  Brain,
  User,
  Flag,
  BarChart3,
  LogOut,
  Heart,
  Bell,
  X,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useNotifications } from "@/context/NotificationContext";
import { COUNTRY_FLAGS } from "@/lib/f1-data";
import logo from "@/assets/FC.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: Flag },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/predictions", label: "Predictions", icon: BarChart3 },
  { to: "/select-driver", label: "Favourites", icon: Heart },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/ai-summary", label: "AI Summary", icon: Brain },
];

function useTimeUntil(isoString) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!isoString) return;
    function update() {
      const ms = new Date(isoString).getTime() - Date.now();
      if (ms <= 0) { setLabel("closing now"); return; }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      if (h >= 24) setLabel(`${Math.floor(h / 24)}d ${h % 24}h`);
      else if (h > 0) setLabel(`${h}h ${m}m`);
      else setLabel(`${m}m`);
    }
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [isoString]);
  return label;
}

const URGENCY_STYLES = {
  low:    { bar: "bg-yellow-400",  text: "text-yellow-400",  border: "border-yellow-400/30",  bg: "bg-yellow-400/10"  },
  medium: { bar: "bg-orange-400",  text: "text-orange-400",  border: "border-orange-400/30",  bg: "bg-orange-400/10"  },
  high:   { bar: "bg-destructive", text: "text-destructive", border: "border-destructive/30", bg: "bg-destructive/10" },
};

function NotificationCard({ notification, onDismiss, onNavigate }) {
  const timeUntil = useTimeUntil(notification.qualifyingAt);
  const flag = COUNTRY_FLAGS[notification.race.country] ?? "🏁";
  const styles = URGENCY_STYLES[notification.urgency] ?? URGENCY_STYLES.medium;

  return (
    <div className={`relative rounded-xl border p-4 ${styles.border} ${styles.bg}`}>
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${styles.bar}`} />
      <button
        type="button"
        onClick={() => onDismiss(notification.key)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="pl-3 pr-5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base leading-none">{flag}</span>
          <span className="text-xs font-semibold text-foreground truncate">
            {notification.race.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{notification.label}</p>
        <div className={`flex items-center gap-1 text-xs font-mono font-semibold mb-3 ${styles.text}`}>
          <Clock className="h-3 w-3" />
          {timeUntil} until qualifying
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
        >
          Lock in predictions
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { addToast } = useToast();
  const { notification, dismiss } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!bellOpen) return;
    function onOutsideClick(e) {
      if (!bellRef.current?.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [bellOpen]);

  useEffect(() => { setBellOpen(false); }, [location.pathname]);

  function handleLogout() {
    logout();
    addToast("You have been logged out.");
    navigate("/login");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between">
        <RouterNavLink to="/" className="flex items-center">
          <img
            src={logo}
            alt="F1 Companion"
            className="h-22 w-auto"
          />
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
            <span className="text-sm font-semibold">{(user?.score ?? 0).toLocaleString()} pts</span>
          </div>

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen((o) => !o)}
              className="relative w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notification && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  1
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-12 w-72 glass-card border border-glass-border rounded-2xl shadow-2xl p-4 z-50">
                <p className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-3">
                  Notifications
                </p>
                {notification ? (
                  <NotificationCard
                    notification={notification}
                    onDismiss={(key) => { dismiss(key); setBellOpen(false); }}
                    onNavigate={() => { navigate("/predictions"); setBellOpen(false); }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Bell className="h-7 w-7 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">You're all caught up</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <RouterNavLink
            to="/profile"
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <User className="w-4 h-4" />
          </RouterNavLink>
          <button
            onClick={handleLogout}
            title={`Log out ${user?.username ?? ""}`}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 hover:text-destructive cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <div className="flex flex-col gap-1">
              <span
                className={`w-4 h-0.5 bg-foreground transition-all ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`}
              />
              <span
                className={`w-4 h-0.5 bg-foreground transition-all ${mobileOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`w-4 h-0.5 bg-foreground transition-all ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
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

            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive transition-all mt-1 border-t border-glass-border pt-3"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
