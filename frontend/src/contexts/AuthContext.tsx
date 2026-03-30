import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { User, UserRole, AuthState } from '@/types';
import { API_BASE_URL } from '@/config';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'pos_auth_user';

const loadStoredAuthState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }

  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }

  try {
    const user = JSON.parse(storedUser) as User;
    return {
      user,
      isAuthenticated: true,
      isLoading: false,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadStoredAuthState());

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);

    void fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => {
      // Ignore warm-up failures; login call will handle real errors.
    });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 15000);
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);

        if (response.ok) {
          const user = await response.json();
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      } catch (error) {
        console.error('Login error:', error);
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      if (state.user) {
        const updatedUser = { ...state.user, role };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        setState((prev) => ({
          ...prev,
          user: updatedUser,
        }));
      }
    },
    [state.user],
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
