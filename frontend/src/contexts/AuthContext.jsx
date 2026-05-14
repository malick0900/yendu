import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginEmail = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ts_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const registerEmail = async ({ email, password, name, phone }) => {
    const { data } = await api.post('/auth/register', { email, password, name, phone });
    localStorage.setItem('ts_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('ts_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, loginEmail, registerEmail, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
