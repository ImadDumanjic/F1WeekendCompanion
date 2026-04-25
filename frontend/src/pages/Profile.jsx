import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flag,
  IdCard,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getFavoriteDriver, getFavoriteTeam } from '@/lib/favorites';

const API = 'http://localhost:3001/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = '-';

function displayValue(value) {
  if (value === null || value === undefined || value === '') return EMPTY;
  return value;
}

function formatDateTime(value) {
  if (!value) return EMPTY;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder }) => (
  <label className="flex flex-col gap-1.5">
    <span className="flex items-center gap-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-glass-border bg-muted/70 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
    />
  </label>
);

const Panel = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-glass-border bg-card/60 shadow-[0_0_28px_rgba(225,6,0,0.045)] backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const StatCard = ({ icon: Icon, value, label, highlight = false }) => (
  <div className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-glass-border bg-background/50 px-2.5 text-center">
    <Icon className={`h-4.5 w-4.5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
    <div className={`font-display text-xl font-bold leading-none ${highlight ? 'text-primary' : 'text-foreground'}`}>
      {displayValue(value)}
    </div>
    <div className="font-display text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </div>
  </div>
);

const PickRow = ({ title, subtitle, badge }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-glass-border bg-background/50 p-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="h-9 w-1 rounded-full bg-primary shadow-[0_0_14px_rgba(225,6,0,0.45)]" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{displayValue(title)}</p>
        <p className="truncate text-xs text-muted-foreground">{displayValue(subtitle)}</p>
      </div>
    </div>
    <span className="rounded-full bg-muted px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
      {badge}
    </span>
  </div>
);

const Profile = () => {
  const { token, updateUser } = useAuth();
  const { addToast } = useToast();

  const [original, setOriginal] = useState({
    username: '',
    name: '',
    email: '',
    score: null,
    lastLoginAt: null,
    passwordChangedAt: null,
  });
  const [favoriteDriver, setFavoriteDriver] = useState(null);
  const [favoriteTeam, setFavoriteTeam] = useState(null);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFavoriteDriver(getFavoriteDriver());
    setFavoriteTeam(getFavoriteTeam());

    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const values = {
          username: data.username ?? '',
          name: data.name ?? '',
          email: data.email ?? '',
          score: data.score ?? null,
          lastLoginAt: data.last_login_at ?? null,
          passwordChangedAt: data.password_changed_at ?? null,
        };
        setOriginal(values);
        setUsername(values.username);
        setName(values.name);
        setEmail(values.email);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function getValidationError() {
    if (!username.trim()) return 'Username is required';
    if (!email.trim()) return 'Email is required';
    if (!EMAIL_RE.test(email)) return 'Invalid email format';
    if (newPassword && newPassword.length < 8) return 'New password must be at least 8 characters';
    if (newPassword && newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  }

  const profileChanged =
    username !== original.username ||
    name !== original.name ||
    email !== original.email;

  const passwordChanged = newPassword.length > 0;
  const hasChanges = profileChanged || passwordChanged;
  const validationError = getValidationError();
  const isDisabled = saving || !hasChanges || validationError !== null;
  const displayError = error || validationError;

  function handleDiscard() {
    setUsername(original.username);
    setName(original.name);
    setEmail(original.email);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (isDisabled) return;

    setError('');
    setSaving(true);

    try {
      const body = { username, name, email };
      if (newPassword) body.newPassword = newPassword;

      const res = await fetch(`${API}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updated = {
        username: data.username ?? '',
        name: data.name ?? '',
        email: data.email ?? '',
        score: data.score ?? original.score,
        lastLoginAt: data.last_login_at ?? original.lastLoginAt,
        passwordChangedAt: data.password_changed_at ?? original.passwordChangedAt,
      };
      setOriginal(updated);
      updateUser({
        username: updated.username,
        name: updated.name,
        email: updated.email,
        last_login_at: updated.lastLoginAt,
        password_changed_at: updated.passwordChangedAt,
      });
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOpen(false);
      addToast('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-7 sm:px-5 lg:px-6">
      <motion.div
        className="mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <section className="mb-7">
          <p className="mb-2.5 font-display text-xs font-bold uppercase tracking-[0.38em] text-primary">
            Driver Dossier
          </p>
          <h1 className="font-display text-4xl font-bold leading-none text-foreground">
            Profile
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            Tune your racing identity, track your standings and lock in your favourite paddock picks.
          </p>
        </section>

        {loading ? (
          <Panel className="flex min-h-48 items-center justify-center p-5">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </Panel>
        ) : (
          <form onSubmit={handleSave} className="grid gap-5 lg:grid-cols-[0.85fr_1.25fr]">
            <div className="flex flex-col gap-4">
              <Panel className="p-4 sm:p-5">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/50 bg-muted/50 shadow-[0_0_28px_rgba(225,6,0,0.22)]">
                    <User className="h-10 w-10 text-foreground/80" />
                    <span className="absolute -bottom-1 -right-1 rounded-full border border-primary/40 bg-background px-2.5 py-0.5 font-display text-xs font-bold text-primary">
                      #-
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {displayValue(username)}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{displayValue(name)}</p>
                </div>

                <div className="my-5 h-px bg-glass-border" />

                <div className="grid grid-cols-3 gap-2.5">
                  <StatCard icon={Trophy} value={original.score} label="Points" highlight />
                  <StatCard icon={Flag} value={EMPTY} label="Rank" />
                  <StatCard icon={Target} value={EMPTY} label="Acc." />
                </div>
              </Panel>

              <Panel className="p-4 sm:p-5">
                <h2 className="mb-3.5 font-display text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  Paddock Picks
                </h2>
                <div className="flex flex-col gap-2.5">
                  <PickRow title={favoriteDriver?.name} subtitle={favoriteDriver?.team} badge="Driver" />
                  <PickRow title={favoriteTeam?.name} subtitle={favoriteTeam?.nationality} badge="Team" />
                </div>
              </Panel>

            </div>

            <Panel className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-3 border-b border-glass-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Account details</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Update your identity. Changes save instantly to your dossier.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full border border-primary/50 px-3 py-1 font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary">
                  Live
                </span>
              </div>

              {displayError && (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {displayError}
                </div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Username" icon={User} value={username} onChange={setUsername} placeholder={EMPTY} />
                <Field label="Full Name" icon={IdCard} value={name} onChange={setName} placeholder={EMPTY} />
                <div className="md:col-span-2">
                  <Field label="Email" icon={Mail} type="email" value={email} onChange={setEmail} placeholder={EMPTY} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-glass-border bg-background/45 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Password &amp; security</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Password changed {formatDateTime(original.passwordChangedAt)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Last logged in {formatDateTime(original.lastLoginAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordOpen(open => !open)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-glass-border px-3.5 py-2.5 font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary/60 hover:text-primary"
                  >
                    <Lock className="h-4 w-4" />
                    Change password
                  </button>
                </div>

                {passwordOpen && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field
                      label="New Password"
                      icon={Lock}
                      type="password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Leave blank to keep current"
                    />
                    <Field
                      label="Confirm Password"
                      icon={Lock}
                      type="password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Confirm new password"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-glass-border pt-5 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={saving || !hasChanges}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground glow-red transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:glow-none"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </Panel>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
