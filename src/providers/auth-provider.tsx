"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, api, getStoredToken, setStoredToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => Promise<User>;
  changePassword: (currentPassword: string, password: string, passwordConfirmation: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  user: User;
  token: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async (): Promise<User | null> => {
    if (!getStoredToken()) {
      setUser(null);
      return null;
    }

    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const rotated = await api.post<{ token: string }>("/auth/refresh");
          setStoredToken(rotated.data.token);
          const renewed = await api.get<User>("/auth/me");
          setUser(renewed.data);
          return renewed.data;
        } catch {
          setStoredToken(null);
          setUser(null);
          return null;
        }
      }

      setStoredToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    refresh().finally(() => {
      if (active) setReady(true);
    });

    const onAuthChange = () => {
      if (!getStoredToken()) setUser(null);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "vs_token") {
        refresh();
      }
    };

    window.addEventListener("vs-auth-change", onAuthChange);
    window.addEventListener("storage", onStorage);

    return () => {
      active = false;
      window.removeEventListener("vs-auth-change", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    setStoredToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      phone?: string;
    }) => {
      const response = await api.post<AuthResponse>("/auth/register", payload);
      setStoredToken(response.data.token);
      setUser(response.data.user);
      return response.data.user;
    },
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, password: string, passwordConfirmation: string) => {
      const response = await api.patch<{ token: string }>("/auth/password", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setStoredToken(response.data.token);
    },
    [],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await api.post("/auth/forgot-password", { email });
  }, []);

  const resetPassword = useCallback(
    async (email: string, token: string, password: string, passwordConfirmation: string) => {
      await api.post("/auth/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // The local session is cleared even if the server token was already revoked.
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, changePassword, forgotPassword, resetPassword, logout, refresh }),
    [user, ready, login, register, changePassword, forgotPassword, resetPassword, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
