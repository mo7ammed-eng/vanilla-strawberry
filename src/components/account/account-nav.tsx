"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ClipboardList, Home, MapPin, UserRound } from "lucide-react";
import { cn, initials } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";

const links = [
  { href: "/account", label: "Overview", icon: Home },
  { href: "/account/orders", label: "Orders", icon: ClipboardList },
  { href: "/account/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
];

export function AccountNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="rounded-2xl border border-border-warm bg-vanilla-0 p-4">
        <div className="flex items-center gap-3 px-1 py-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-vanilla-0">
            {user ? initials(user.name) : "VS"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name ?? "Your account"}</p>
            <p className="truncate text-xs text-ink-600">{user?.email}</p>
          </div>
        </div>
        <nav aria-label="Account" className="mt-3 flex gap-1 overflow-x-auto border-t border-border-warm pt-3 lg:flex-col">
          {links.map((link) => {
            const active = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-vanilla-100 font-semibold text-ink-900" : "text-ink-600 hover:bg-vanilla-50 hover:text-ink-900",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
