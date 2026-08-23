import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: string; department?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isAnalyst: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cyber_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('cyber_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          localStorage.removeItem('cyber_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('cyber_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const demoLogin = async (role: UserRole) => {
    let email = 'analyst@cyberguard.io';
    let pass = 'Analyst@123456';
    if (role === 'admin') {
      email = 'admin@cyberguard.io';
      pass = 'Admin@123456';
    } else if (role === 'viewer') {
      email = 'viewer@cyberguard.io';
      pass = 'Viewer@123456';
    }
    await login(email, pass);
  };

  const register = async (data: { name: string; email: string; password: string; role: string; department?: string }) => {
    const res = await api.register(data);
    localStorage.setItem('cyber_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('cyber_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch {
        // ignore
      }
    }
  };

  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst' || user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
        isAdmin,
        isAnalyst,
        isViewer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
