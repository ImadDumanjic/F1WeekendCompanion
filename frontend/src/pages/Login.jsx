import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import logo from '@/assets/FC.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src={logo} alt="F1 Companion" className="h-28 w-auto" />
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-glass-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-glass-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register now!
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
