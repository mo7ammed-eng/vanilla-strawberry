"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth } from "@/providers/auth-provider";
import { initials } from "@/lib/format";

export function StaffHeader({ area }: { area: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-warm bg-vanilla-0/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo compact />
          <span className="hidden h-5 w-px bg-border-warm sm:block" />
          <span className="eyebrow hidden sm:block">{area}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden text-xs font-medium text-ink-600 hover:text-ink-900 sm:block">
            View restaurant site
          </Link>
          <NotificationBell />
          {user ? (
            <div className="flex items-center gap-2 border-l border-border-warm pl-2 sm:pl-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-[11px] font-bold text-vanilla-0">
                {initials(user.name)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-semibold">{user.name}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-600">{user.role_label}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-ink-600 transition hover:bg-vanilla-100 hover:text-danger"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
