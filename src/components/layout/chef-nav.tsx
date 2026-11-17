"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function ChefNav() {
  const { user } = useAuth();

  return (
    <div className="border-b border-border-warm bg-vanilla-0">
      <div className="container-page flex h-12 items-center justify-between gap-4">
        <nav aria-label="Kitchen" className="flex items-center gap-1">
          <Link href="/chef" className={buttonClasses("ghost", "sm")}>
            Order board
          </Link>
        </nav>
        {user?.role === "admin" ? (
          <Link href="/admin" className={buttonClasses("ghost", "sm")}>
            Admin dashboard
          </Link>
        ) : null}
      </div>
    </div>
  );
}
