// ============================================================
// Authentication Context — JWT + AsyncStorage
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type PropsWithChildren,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import type { User, LoginPayload, RegisterPayload } from '@/types';
import { loginUser, registerUser } from '@/services/auth.service';
import {
  getToken,
  setToken,
  getUser,
  setUser as storeUser,
  clearAuth,
} from '@/utils/storage';

// ---- Types ----
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

// ---- Context ----
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---- Provider ----
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const router = useRouter();
  const segments = useSegments();

  // Hydrate auth state from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();
        if (storedToken && storedUser) {
          setState({
            token: storedToken,
            user: JSON.parse(storedUser) as User,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  // Protect routes: redirect based on auth state
  useEffect(() => {
    if (state.isLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';

    if (!state.isAuthenticated && !inAuthGroup) {
      // Not logged in → go to login
      router.replace('/(auth)/login' as any);
    } else if (state.isAuthenticated && inAuthGroup) {
      // Logged in but on auth screen → go to dashboard
      router.replace('/(tabs)' as any);
    }
  }, [state.isAuthenticated, state.isLoading, segments]);

  // ---- Actions ----
  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginUser(payload);
    await setToken(response.token);
    await storeUser(JSON.stringify(response.user));
    setState({
      token: response.token,
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerUser(payload);
    await setToken(response.token);
    await storeUser(JSON.stringify(response.user));
    setState({
      token: response.token,
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setState({
      token: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook ----
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
