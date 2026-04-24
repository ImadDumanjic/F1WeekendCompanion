import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import logo from '@/assets/FC.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();
  const { register, token } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const emailValid = !email || EMAIL_RE.test(email);
  const passwordValid = !password || password.length >= 8;
  const isDisabled = !username || !email || !password || !emailValid || !passwordValid || loading;

  function getValidationError() {
    if (email && !EMAIL_RE.test(email)) return 'Enter a valid email address';
    if (password && password.length < 8) return 'Password must be at least 8 characters';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      addToast('Account created! Welcome to F1 Companion.');
      navigate('/select-driver');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const validationError = getValidationError();
  const displayError = error || validationError;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src={logo} alt="F1 Companion" className="h-28 w-auto" />
          <p className="text-muted-foreground text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 flex flex-col gap-4">
          {displayError && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {displayError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="verstappen1"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-glass-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-colors"
            />
          </div>

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
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
