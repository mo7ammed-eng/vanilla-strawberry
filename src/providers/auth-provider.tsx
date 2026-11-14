"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getStoredToken, setStoredToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
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
    } catch {
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
    async (payload: { name: string; email: string; password: string; phone?: string }) => {
      const response = await api.post<AuthResponse>("/auth/register", payload);
      setStoredToken(response.data.token);
      setUser(response.data.user);
      return response.data.user;
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
    () => ({ user, ready, login, register, logout, refresh }),
    [user, ready, login, register, logout, refresh],
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
