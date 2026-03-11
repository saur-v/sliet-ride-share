// client/src/contexts/AuthContext.jsx
// Provides: user, loading, login(), logout(), refreshUser()
// Reads user from localStorage on mount, then verifies with /users/me

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi, authApi } from '../services/api.js';

// Named export so tests can inject a fake context value directly
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if we have a stored token and fetch the user
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    userApi.getMe()
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithTokens = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await authApi.logout({ refreshToken }); } catch (_) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await userApi.getMe();
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithTokens, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
