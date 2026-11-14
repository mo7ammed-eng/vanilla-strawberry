"use client";

import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { TableSessionProvider } from "@/providers/table-session-provider";
import { ToastProvider } from "@/providers/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <TableSessionProvider>{children}</TableSessionProvider>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
