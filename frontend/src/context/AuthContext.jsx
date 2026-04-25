import { createContext, useContext, useState } from 'react';
import { clearFavorites } from '@/lib/favorites';

const AuthContext = createContext(null);

const API = 'http://localhost:3001/api';

function getStoredAuthItem(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function clearStoredAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredAuthItem('token'));
  const [user, setUser] = useState(() => {
    const stored = getStoredAuthItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  function persist(newToken, newUser, rememberMe = false) {
    clearStoredAuth();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', newToken);
    storage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email, password, rememberMe = false) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    persist(data.token, data.user, data.user?.remember_me ?? rememberMe);
  }

  async function register(username, email, password) {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    persist(data.token, data.user, data.user?.remember_me ?? false);
  }

  function updateUser(updatedFields) {
    const merged = { ...user, ...updatedFields };
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  }

  function logout() {
    clearStoredAuth();
    clearFavorites();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
