import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, FileText } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const API = 'http://localhost:3001/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-glass-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
    />
  </div>
);

const Profile = () => {
  const { token, updateUser } = useAuth();
  const { addToast } = useToast();

  const [original, setOriginal] = useState({ username: '', name: '', email: '' });

  const [username, setUsername]               = useState('');
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const values = {
          username: data.username ?? '',
          name: data.name ?? '',
          email: data.email ?? '',
        };
        setOriginal(values);
        setUsername(values.username);
        setName(values.name);
        setEmail(values.email);
      })
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
  const hasChanges      = profileChanged || passwordChanged;
  const validationError = getValidationError();
  const isDisabled      = saving || !hasChanges || validationError !== null;

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

      const updated = { username: data.username, name: data.name, email: data.email };
      setOriginal(updated);
      updateUser(updated);
      setNewPassword('');
      setConfirmPassword('');
      addToast('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-8 font-display text-3xl sm:text-4xl">PROFILE</h1>

          {loading ? (
            <div className="glass-card p-8 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="glass-card p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex justify-center mb-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted ring-2 ring-primary/30">
                  <User className="h-9 w-9 text-muted-foreground" />
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Field label="Username"  icon={User}     value={username} onChange={setUsername} placeholder="verstappen1" />
              <Field label="Full Name" icon={FileText}  value={name}     onChange={setName}     placeholder="Max Verstappen" />
              <Field label="Email"     icon={Mail}     type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

              <div className="border-t border-glass-border pt-4 flex flex-col gap-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Change Password</p>
                <Field label="New Password"     icon={Lock} type="password" value={newPassword}     onChange={setNewPassword}     placeholder="Leave blank to keep current" />
                <Field label="Confirm Password" icon={Lock} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-display text-sm uppercase tracking-wider text-primary-foreground glow-red hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:glow-none mt-1"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
