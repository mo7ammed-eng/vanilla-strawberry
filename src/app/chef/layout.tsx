import type { Metadata } from "next";
import { RoleGate } from "@/components/auth/role-gate";
import { StaffHeader } from "@/components/layout/staff-header";
import { ChefNav } from "@/components/layout/chef-nav";

export const metadata: Metadata = {
  title: "Kitchen",
  robots: { index: false, follow: false },
};

export default function ChefLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["chef", "admin"]}>
      <div className="min-h-screen bg-vanilla-50">
        <StaffHeader area="Kitchen" />
        <ChefNav />
        <main id="main-content" className="container-page py-6 sm:py-8">
          {children}
        </main>
      </div>
    </RoleGate>
  );
}
