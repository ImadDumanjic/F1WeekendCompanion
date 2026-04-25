import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import logo from '@/assets/FC.png';
import wallpaper from '@/assets/FCWallpaper.png';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const isDisabled = !email || !password || loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      addToast('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative grid min-h-screen min-h-dvh place-items-center px-4 py-8"
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark + red overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.78) 60%, rgba(120,10,10,0.45) 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-md">

        {/* Branding */}
        <div className="flex flex-col items-center gap-1 mb-8">
          <img src={logo} alt="FC Racing" className="h-40 w-auto" />
          {/* Driver Portal with red side lines */}
          <div className="flex items-center gap-3">
            <span className="block h-px w-8 bg-primary" />
            <p className="font-display text-sm font-bold tracking-[0.3em] uppercase text-muted-foreground">Driver Portal</p>
            <span className="block h-px w-8 bg-primary" />
          </div>
        </div>

        {/* Card */}
        <div
          className="flex flex-col gap-5 rounded-2xl border-t-2 border-t-primary p-8 glow-red backdrop-blur-xl"
          style={{ background: 'rgba(8, 8, 12, 0.72)', border: '1px solid rgba(255,255,255,0.07)', borderTopColor: 'hsl(1 100% 44%)' }}
        >
          {/* Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold tracking-widest uppercase text-foreground">Sign In</h1>
            <p className="text-xs text-muted-foreground">Enter your details to continue</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Email</label>
            <div
              className="relative flex items-center rounded-xl ring-1 ring-white/10 transition-all focus-within:ring-2 focus-within:ring-primary"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <Mail className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input w-full pl-10 pr-4 py-3 rounded-xl bg-transparent border-0 outline-none ring-0 text-white placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
            </div>
            <div
              className="relative flex items-center rounded-xl ring-1 ring-white/10 transition-all focus-within:ring-2 focus-within:ring-primary"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <Lock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input w-full pl-10 pr-4 py-3 rounded-xl bg-transparent border-0 outline-none ring-0 text-white placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground">Remember me</span>
          </label>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold tracking-[0.2em] uppercase text-base hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-red"
          >
            {loading ? 'Signing in…' : 'Start Engine →'}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
