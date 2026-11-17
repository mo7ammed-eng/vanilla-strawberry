"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const isStaffArea = pathname.startsWith("/admin") || pathname.startsWith("/chef");

  if (isStaffArea) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader onCartOpen={() => setCartOpen(true)} />
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
