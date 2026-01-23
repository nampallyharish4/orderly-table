import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials
const DEMO_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  'nampallyharish5544@gmail.com': { password: 'Harish81870Nampally', userId: 'user-1' },
};

const AUTH_STORAGE_KEY = 'pos_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const credentials = DEMO_CREDENTIALS[email.toLowerCase()];
    if (credentials && credentials.password === password) {
      const user = mockUsers.find(u => u.id === credentials.userId);
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
    }

    setState(prev => ({ ...prev, isLoading: false }));
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  // Demo function to quickly switch roles
  const switchRole = useCallback((role: UserRole) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Defensive fallback to avoid blank-screen crashes during hot reloads
    console.warn('useAuth was called outside AuthProvider; returning a safe fallback.');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => false,
      logout: () => {},
      switchRole: () => {},
    } as AuthContextType;
  }
  return context;
}

export function useRequireAuth() {
  const auth = useAuth();
  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error('User must be authenticated');
  }
  return auth;
}
