import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role, User } from '../types';
import { getMe, logoutUser } from '../lib/auth';

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  login: (role: Role) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((data) => {
        setCurrentUser(data.user as User);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (role: Role) => {
    void role;
    setCurrentUser(null);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore logout failures and clear local state.
    }
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}