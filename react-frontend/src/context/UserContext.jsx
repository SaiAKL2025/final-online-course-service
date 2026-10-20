import { useCallback, useEffect, useRef, useState } from "react";
import { UserContext } from "./UserContextValue.js";
import { API_URL } from "./api.js";

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "The request could not be completed.");
    return data;
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    api("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [api]);

  const login = useCallback(async (username, password) => {
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    setUser(data.user);
    return data.user;
  }, [api]);

  const logout = useCallback(async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } finally { setUser(null); }
  }, [api]);

  return <UserContext.Provider value={{ user, loading, login, logout, api }}>{children}</UserContext.Provider>;
}
