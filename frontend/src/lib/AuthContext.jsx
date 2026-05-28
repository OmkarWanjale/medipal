import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('medipal_token');
    if (token) {
      api.me()
        .then(({ user }) => setUser(user))
        .catch(() => localStorage.removeItem('medipal_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('medipal_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await api.register({ name, email, password, role });
    localStorage.setItem('medipal_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('medipal_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
