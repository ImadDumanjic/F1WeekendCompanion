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
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import logo from "@/assets/FC.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: Flag },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/predictions", label: "Predictions", icon: BarChart3 },
  { to: "/select-driver", label: "Favourites", icon: Heart },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/ai-summary", label: "AI Summary", icon: Brain },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { addToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

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
