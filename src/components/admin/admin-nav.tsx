"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ChefHat,
  ClipboardList,
  Coffee,
  GalleryHorizontalEnd,
  LayoutDashboard,
  MapPin,
  Settings2,
  ShoppingBag,
  Tag,
  TicketPercent,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/format";

const groups: { label: string; links: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Service",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/reservations", label: "Reservations", icon: CalendarCheck },
      { href: "/admin/tables", label: "Tables & QR", icon: MapPin },
    ],
  },
  {
    label: "Menu",
    links: [
      { href: "/admin/products", label: "Products", icon: Coffee },
      { href: "/admin/categories", label: "Categories", icon: ShoppingBag },
      { href: "/admin/add-ons", label: "Add-ons", icon: Tag },
    ],
  },
  {
    label: "Marketing",
    links: [
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
      { href: "/admin/gallery", label: "Gallery", icon: GalleryHorizontalEnd },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/admin/customers", label: "Customers", icon: UsersRound },
      { href: "/admin/chefs", label: "Chefs", icon: ChefHat },
    ],
  },
  {
    label: "System",
    links: [{ href: "/admin/settings", label: "Settings", icon: Settings2 }],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-y-auto">
      <nav aria-label="Admin" className="hide-scrollbar flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-4 lg:pb-0">
        {groups.map((group) => (
          <div key={group.label} className="contents lg:block">
            <p className="hidden px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-600 lg:block">
              {group.label}
            </p>
            <div className="flex gap-1 lg:flex-col">
              {group.links.map((link) => {
                const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition lg:text-sm",
                      active
                        ? "bg-ink-900 text-vanilla-0"
                        : "text-ink-600 hover:bg-vanilla-100 hover:text-ink-900",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
