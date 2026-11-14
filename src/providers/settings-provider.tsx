"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PublicSettings } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";
import { api } from "@/lib/api";

interface SettingsContextValue {
  settings: PublicSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await api.get<PublicSettings>("/settings");
      setSettings(response.data);
    } catch {
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ settings, loading, refresh }), [settings, loading, refresh]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return context;
}
