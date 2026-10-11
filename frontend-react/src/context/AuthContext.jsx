import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Api, session } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (session.getToken() ? session.getUser() : null));

  // api/client.js fires this when the server answers 401 (token expired/invalid)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await Api.login({ username, password });
    const u = { id: res.id, username: res.username, email: res.email, role: res.role };
    session.set(res.token, u);
    setUser(u);
    return u;
  }, []);

  const register = useCallback((username, email, password) => Api.register({ username, email, password }), []);

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoggedIn: !!user, isAdmin: user?.role === 'ROLE_ADMIN', login, register, logout }),
    [user, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
