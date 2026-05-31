import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const API = `${import.meta.env.VITE_API_URL}/api`;
const POLL_MS = 5 * 60 * 1000;

export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const [notification, setNotification] = useState(null);

  const fetchNotification = useCallback(async () => {
    if (!token) { setNotification(null); return; }
    try {
      const r = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;
      const data = await r.json();
      setNotification(data.notification ?? null);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotification();
    const id = setInterval(fetchNotification, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotification]);

  function isDismissed(key) {
    return localStorage.getItem(key) === "1";
  }

  function dismiss(key) {
    localStorage.setItem(key, "1");
    setNotification(null);
  }

  const active = notification && !isDismissed(notification.key) ? notification : null;

  return (
    <NotificationContext.Provider value={{ notification: active, dismiss, refetch: fetchNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
