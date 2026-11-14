"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const TABLE_KEY = "vs_table_session_v1";

export interface TableSession {
  tableToken: string;
  tableName: string;
  zone: string | null;
  sessionToken: string;
  openedAt: string | null;
}

interface TableSessionContextValue {
  session: TableSession | null;
  hydrated: boolean;
  setSession: (session: TableSession) => void;
  clearSession: () => void;
}

const TableSessionContext = createContext<TableSessionContextValue | null>(null);

function readSession(): TableSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TABLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TableSession>;
    if (typeof parsed.tableToken !== "string" || typeof parsed.sessionToken !== "string") {
      return null;
    }
    return {
      tableToken: parsed.tableToken,
      tableName: parsed.tableName ?? "Table",
      zone: parsed.zone ?? null,
      sessionToken: parsed.sessionToken,
      openedAt: parsed.openedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function TableSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<TableSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSessionState(readSession());
    setHydrated(true);
  }, []);

  const setSession = useCallback((next: TableSession) => {
    setSessionState(next);
    window.localStorage.setItem(TABLE_KEY, JSON.stringify(next));
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    window.localStorage.removeItem(TABLE_KEY);
  }, []);

  useEffect(() => {
    if (!session) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === TABLE_KEY) setSessionState(readSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [session]);

  const value = useMemo(
    () => ({ session, hydrated, setSession, clearSession }),
    [session, hydrated, setSession, clearSession],
  );

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>;
}

export function useTableSession(): TableSessionContextValue {
  const context = useContext(TableSessionContext);
  if (!context) {
    throw new Error("useTableSession must be used inside TableSessionProvider");
  }
  return context;
}
