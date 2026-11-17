"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faReceipt,
  faUser,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { QrScanner } from "@/components/qr/qr-scanner";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/format";

const items = [
  { href: "/", label: "Home", icon: faHouse },
  { href: "/menu", label: "Menu", icon: faUtensils },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const accountHref = user ? "/account" : "/login";
  const ordersHref = user ? "/account/orders" : "/login";
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-warm bg-vanilla-0/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1 px-2 py-1.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition",
              isActive(item.href) ? "text-strawberry-700" : "text-ink-600 hover:text-ink-900",
            )}
          >
            <FontAwesomeIcon icon={item.icon} className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        ))}

        <QrScanner />

        <Link
          href={ordersHref}
          aria-current={isActive(ordersHref) ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition",
            isActive(ordersHref) ? "text-strawberry-700" : "text-ink-600 hover:text-ink-900",
          )}
        >
          <FontAwesomeIcon icon={faReceipt} className="h-[18px] w-[18px]" />
          Orders
        </Link>
        <Link
          href={accountHref}
          aria-current={isActive(accountHref) ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition",
            isActive(accountHref) ? "text-strawberry-700" : "text-ink-600 hover:text-ink-900",
          )}
        >
          <FontAwesomeIcon icon={faUser} className="h-[18px] w-[18px]" />
          Account
        </Link>
      </div>
    </nav>
  );
}
