import Link from "next/link";
import { RoleGate } from "@/components/auth/role-gate";
import { StaffHeader } from "@/components/layout/staff-header";
import { buttonClasses } from "@/components/ui/button";

export default function ChefLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["chef", "admin"]}>
      <div className="min-h-screen bg-vanilla-50">
        <StaffHeader area="Kitchen" />
        <div className="border-b border-border-warm bg-vanilla-0">
          <div className="container-page flex h-12 items-center justify-between gap-4">
            <nav aria-label="Kitchen" className="flex items-center gap-1">
              <Link href="/chef" className={buttonClasses("ghost", "sm")}>
                Order board
              </Link>
            </nav>
            <Link href="/admin" className={buttonClasses("ghost", "sm")}>
              Admin dashboard
            </Link>
          </div>
        </div>
        <main id="main-content" className="container-page py-6 sm:py-8">
          {children}
        </main>
      </div>
    </RoleGate>
  );
}
