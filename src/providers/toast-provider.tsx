"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/format";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++toastId;
    setToasts((current) => [...current.slice(-3), { id, message, variant }]);
    window.setTimeout(() => remove(id), 4500);
  }, [remove]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-vanilla-0 px-4 py-3 text-sm shadow-lift",
              item.variant === "success" && "border-success/30",
              item.variant === "error" && "border-danger/30",
              item.variant === "info" && "border-border-warm",
            )}
          >
            <span
              className={cn(
                "mt-0.5",
                item.variant === "success" && "text-success",
                item.variant === "error" && "text-danger",
                item.variant === "info" && "text-strawberry-700",
              )}
            >
              {item.variant === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : item.variant === "error" ? (
                <TriangleAlert className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </span>
            <p className="flex-1 text-ink-700">{item.message}</p>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="rounded p-1 text-ink-600 transition hover:bg-vanilla-100 hover:text-ink-900"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
