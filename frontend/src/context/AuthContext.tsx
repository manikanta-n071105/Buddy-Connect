import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';
import { secureGetItem, secureSetItem, secureRemoveItem } from '../utils/secureStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = secureGetItem('accessToken') || localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch (err) {
      secureRemoveItem('accessToken');
      secureRemoveItem('refreshToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { usernameOrEmail: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    const { user: loggedInUser, tokens } = res.data.data;
    secureSetItem('accessToken', tokens.accessToken);
    secureSetItem('refreshToken', tokens.refreshToken);
    setUser(loggedInUser);
  };

  const logout = () => {
    secureRemoveItem('accessToken');
    secureRemoveItem('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'ADMIN' && user.permissions?.includes(permission)) return true;
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser: fetchCurrentUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
