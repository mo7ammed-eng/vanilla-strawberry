"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useSettings } from "@/providers/settings-provider";
import { cn, initials } from "@/lib/format";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our story" },
  { href: "/reservations", label: "Reservations" },
  { href: "/gallery", label: "Gallery" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { itemCount } = useCart();
  const { settings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    router.push("/");
  };

  const dashboardHref = user?.role === "admin" ? "/admin" : user?.role === "chef" ? "/chef" : "/account";

  return (
    <header className="sticky top-0 z-50 border-b border-border-warm/80 bg-vanilla-50/92 backdrop-blur-md">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo compact />

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative py-2 text-sm font-medium text-ink-700 transition hover:text-ink-900",
                isActive(link.href) && "text-ink-900",
              )}
            >
              {link.label}
              {isActive(link.href) ? (
                <span className="absolute inset-x-0 -bottom-0.5 h-px bg-strawberry-500" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {ready && user ? <NotificationBell /> : null}

          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-vanilla-100 hover:text-ink-900"
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-strawberry-500 px-1 text-[10px] font-bold text-vanilla-0">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </Link>

          {ready && user ? (
            <div ref={accountRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-border-warm bg-vanilla-0 py-1 pl-1 pr-2.5 text-sm transition hover:border-ink-900/20"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-[11px] font-bold text-vanilla-0">
                  {initials(user.name)}
                </span>
                <span className="max-w-24 truncate font-medium">{user.name.split(" ")[0]}</span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-600" />
              </button>
              {accountOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-border-warm bg-vanilla-0 p-1.5 shadow-lift"
                >
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-ink-600">{user.email}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-strawberry-700">
                      {user.role_label}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-border-warm" />
                  <Link href={dashboardHref} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-vanilla-100">
                    <LayoutDashboard className="h-4 w-4 text-ink-600" />
                    {user.role === "customer" ? "My account" : "Dashboard"}
                  </Link>
                  <Link href="/account/orders" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-vanilla-100">
                    <ClipboardList className="h-4 w-4 text-ink-600" />
                    My orders
                  </Link>
                  <Link href="/account/reservations" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-vanilla-100">
                    <CalendarCheck className="h-4 w-4 text-ink-600" />
                    Reservations
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-strawberry-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-vanilla-100 sm:flex"
            >
              <UserRound className="h-4 w-4" />
              Sign in
            </Link>
          )}

          <Link
            href="/menu"
            className="hidden h-10 items-center rounded-full bg-strawberry-500 px-4 text-xs font-semibold text-vanilla-0 transition hover:bg-strawberry-700 md:inline-flex"
          >
            Order now
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition hover:bg-vanilla-100 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-navigation" className="border-t border-border-warm bg-vanilla-0 lg:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-border-warm/70 py-3.5 text-base font-medium text-ink-900 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              {ready && user ? (
                <>
                  <div className="mb-1 flex items-center gap-3 px-1 py-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-vanilla-0">
                      {initials(user.name)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-ink-600">{user.role_label}</p>
                    </div>
                  </div>
                  <Link
                    href={dashboardHref}
                    className="rounded-full border border-border-warm px-5 py-3 text-center text-sm font-semibold"
                  >
                    {user.role === "customer" ? "My account" : "Dashboard"}
                  </Link>
                  <Link
                    href="/account/orders"
                    className="rounded-full border border-border-warm px-5 py-3 text-center text-sm font-semibold"
                  >
                    My orders
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full px-5 py-3 text-center text-sm font-semibold text-danger"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-warm px-5 text-sm font-semibold"
                >
                  <UserRound className="h-4 w-4" />
                  Sign in
                </Link>
              )}
              <Link
                href="/menu"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-strawberry-500 px-5 text-sm font-semibold text-vanilla-0"
              >
                <ShoppingBag className="h-4 w-4" />
                Order now
              </Link>
              <a
                href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                className="py-2 text-center text-xs text-ink-600"
              >
                <Phone className="mr-1 inline h-3 w-3" />
                {settings.phone}
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
