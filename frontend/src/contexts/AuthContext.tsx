import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
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
const TOKEN_STORAGE_KEY = 'pos_auth_token';

/** Retrieve the stored JWT token (used by api.ts interceptor). */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

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

  // Keep a ref to the warm-up promise so login can await it before its first attempt.
  const warmupRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    warmupRef.current = fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(() => {})
      .catch(() => {
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

      // Wait for the warm-up ping to finish (success or fail) so the backend
      // is as ready as possible before we hit the login endpoint.
      if (warmupRef.current) {
        await warmupRef.current;
      }

      const MAX_RETRIES = 2;
      const TIMEOUT_MS = 8000;
      const body = JSON.stringify({ email, password });

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: controller.signal,
          });
          window.clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const { token, ...user } = data;
            // Store JWT token separately
            if (token) {
              localStorage.setItem(TOKEN_STORAGE_KEY, token);
            }
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }

          // Non-retryable HTTP error (401, 400, etc.) — stop immediately.
          break;
        } catch (error) {
          // Network / timeout error — retry if attempts remain.
          if (attempt === MAX_RETRIES) {
            console.error('Login error after retries:', error);
          }
        }
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
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
