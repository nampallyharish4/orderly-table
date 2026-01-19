import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'waiter' | 'cashier' | 'kitchen';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createUser: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  getAllUsers: () => Promise<User[]>;
}

// Mock users storage (persisted in localStorage)
const MOCK_USERS_KEY = 'restaurant_pos_users';
const CURRENT_USER_KEY = 'restaurant_pos_current_user';

// Default admin user
const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  name: 'Administrator',
  email: 'admin@gmail.com',
  role: 'admin',
};

const getStoredUsers = (): Array<User & { password: string }> => {
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with default admin
  const defaultUsers = [{ ...DEFAULT_ADMIN, password: 'admin123' }];
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

const saveUsers = (users: Array<User & { password: string }>) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing session on mount
    const user = getCurrentUser();
    if (user) {
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      setState({
        user: userWithoutPassword,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    }

    setState(prev => ({ ...prev, isLoading: false }));
    return { success: false, error: 'Invalid email or password' };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const createUser = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    // Only admins can create users
    if (state.user?.role !== 'admin') {
      return { success: false, error: 'Only administrators can create users' };
    }

    const users = getStoredUsers();
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'A user with this email already exists' };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      password,
    };

    users.push(newUser);
    saveUsers(users);

    // Also save to Supabase for data consistency
    try {
      await supabase.from('profiles').insert({
        id: newUser.id,
        user_id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
    } catch (error) {
      console.log('Note: User created locally only');
    }

    return { success: true };
  }, [state.user]);

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    const users = getStoredUsers();
    return users.map(({ password: _, ...user }) => user);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, createUser, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth was called outside AuthProvider; returning a safe fallback.');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({ success: false, error: 'Not initialized' }),
      logout: () => {},
      createUser: async () => ({ success: false, error: 'Not initialized' }),
      getAllUsers: async () => [],
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
